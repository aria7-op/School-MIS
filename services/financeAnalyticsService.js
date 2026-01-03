import prisma from '../utils/prismaClient.js';

const OUTSTANDING_STATUSES = ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID', 'PENDING'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeAmount = (value, fallback = 0) => Number(value ?? fallback);

const groupByDate = (records, key) =>
  records.reduce((acc, record) => {
    const point = record[key];
    if (!point) return acc;
    const bucket = new Date(point).toISOString().slice(0, 10);
    acc[bucket] = (acc[bucket] || 0) + normalizeAmount(record.total, 0);
    return acc;
  }, {});

const computeMonthlyBreakdown = (records) =>
  records.reduce((acc, record) => {
    const bucketSource = record.paymentDate || record.createdAt;
    if (!bucketSource) return acc;
    const bucket = new Date(bucketSource).toISOString().slice(0, 7);
    acc[bucket] = (acc[bucket] || 0) + normalizeAmount(record.total, 0);
    return acc;
  }, {});

const determineAgingBucket = (dueDate, referenceDate) => {
  if (!dueDate) return 'unknown';
  const diff = Math.floor((referenceDate.getTime() - dueDate.getTime()) / MS_PER_DAY);
  if (diff <= 0) return 'current';
  if (diff <= 30) return 'days1to30';
  if (diff <= 60) return 'days31to60';
  if (diff <= 90) return 'days61to90';
  return 'days90Plus';
};

const initializeAgingBuckets = () => ({
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90Plus: 0,
  unknown: 0,
});

const mapPayment = (payment) => ({
  id: payment.id.toString(),
  status: payment.status,
  total: normalizeAmount(payment.total),
  paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : null,
  dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
  method: payment.method ?? 'UNKNOWN',
  school: payment.school
    ? {
        id: payment.school.id.toString(),
        name: payment.school.name,
        code: payment.school.code,
      }
    : null,
});

const financeAnalyticsService = {
  async getSummary({ start, end, filters, schoolFilter }) {
    const baseWhere = {
      deletedAt: null,
      ...(filters.schoolId ? { schoolId: BigInt(filters.schoolId) } : {}),
      ...(schoolFilter ? { school: schoolFilter } : {}),
    };

    const rangeWhere = {
      ...baseWhere,
      paymentDate: { gte: start, lte: end },
    };

    const [paymentsInRange, outstandingPayments, recentPayments] = await Promise.all([
      prisma.payment.findMany({
        where: rangeWhere,
        select: {
          id: true,
          total: true,
          status: true,
          paymentDate: true,
          dueDate: true,
          method: true,
          schoolId: true,
          school: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.payment.findMany({
        where: {
          ...baseWhere,
          status: { in: OUTSTANDING_STATUSES },
        },
        select: {
          id: true,
          total: true,
          status: true,
          dueDate: true,
          schoolId: true,
          school: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.payment.findMany({
        where: rangeWhere,
        orderBy: { paymentDate: 'desc' },
        take: 10,
        select: {
          id: true,
          total: true,
          status: true,
          paymentDate: true,
          dueDate: true,
          method: true,
          schoolId: true,
          school: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    const durationDays = Math.max(1, Math.ceil((end - start) / MS_PER_DAY));
    const invoicedTotal = paymentsInRange.reduce((sum, payment) => sum + normalizeAmount(payment.total), 0);
    const paidPayments = paymentsInRange.filter((payment) => payment.status === 'PAID');
    const collectedTotal = paidPayments.reduce((sum, payment) => sum + normalizeAmount(payment.total), 0);
    const outstandingTotal = outstandingPayments.reduce(
      (sum, payment) => sum + normalizeAmount(payment.total),
      0,
    );

    const overdueTotal = outstandingPayments.reduce((sum, payment) => {
      if (!payment.dueDate) return sum;
      return payment.dueDate < end ? sum + normalizeAmount(payment.total) : sum;
    }, 0);

    const paymentMethodBreakdown = paidPayments.reduce((acc, payment) => {
      const method = payment.method || 'UNKNOWN';
      acc[method] = (acc[method] || 0) + normalizeAmount(payment.total);
      return acc;
    }, {});

    const agingBuckets = outstandingPayments.reduce((acc, payment) => {
      const bucket = determineAgingBucket(payment.dueDate, end);
      acc[bucket] = (acc[bucket] || 0) + normalizeAmount(payment.total);
      return acc;
    }, initializeAgingBuckets());

    const uniquePayingSchools = new Set(
      paidPayments
        .map((payment) => (payment.schoolId ? payment.schoolId.toString() : null))
        .filter(Boolean),
    ).size;

    const averagePaymentDelay = (() => {
      const delays = paidPayments
        .filter((payment) => payment.dueDate && payment.paymentDate)
        .map((payment) => {
          const diff = payment.paymentDate.getTime() - payment.dueDate.getTime();
          return diff / MS_PER_DAY;
        });
      if (!delays.length) return null;
      const avg = delays.reduce((sum, value) => sum + value, 0) / delays.length;
      return Number(avg.toFixed(2));
    })();

    const topOutstandingMap = outstandingPayments.reduce((acc, payment) => {
      const key = payment.schoolId ? payment.schoolId.toString() : 'unassigned';
      if (!acc.has(key)) {
        acc.set(key, {
          total: 0,
          overdue: 0,
          schoolName: payment.school?.name || 'Unassigned',
          schoolCode: payment.school?.code || null,
        });
      }
      const record = acc.get(key);
      record.total += normalizeAmount(payment.total);
      if (payment.dueDate && payment.dueDate < end) {
        record.overdue += normalizeAmount(payment.total);
      }
      acc.set(key, record);
      return acc;
    }, new Map());

    const topOutstandingSchools = Array.from(topOutstandingMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([schoolId, info]) => ({
        schoolId,
        schoolName: info.schoolName,
        schoolCode: info.schoolCode,
        outstandingAmount: Number(info.total.toFixed(2)),
        overdueAmount: Number(info.overdue.toFixed(2)),
      }));

    const collectionRate = invoicedTotal ? Number((collectedTotal / invoicedTotal).toFixed(4)) : 0;
    const mrr = Number(((collectedTotal / durationDays) * 30).toFixed(2));
    const arr = Number((mrr * 12).toFixed(2));
    const averageRevenuePerSchool = uniquePayingSchools
      ? Number((collectedTotal / uniquePayingSchools).toFixed(2))
      : 0;
    const averageTransactionValue = paidPayments.length
      ? Number((collectedTotal / paidPayments.length).toFixed(2))
      : 0;

    const dso = collectedTotal
      ? Number(((outstandingTotal / collectedTotal) * durationDays).toFixed(2))
      : null;

    return {
      revenue: Number(collectedTotal.toFixed(2)),
      outstanding: Number(outstandingTotal.toFixed(2)),
      overdue: Number(overdueTotal.toFixed(2)),
      revenueTrend: groupByDate(paidPayments, 'paymentDate'),
      monthlyRevenue: computeMonthlyBreakdown(paidPayments),
      uniquePayingSchools,
      mrr,
      arr,
      averageRevenuePerSchool,
      averageTransactionValue,
      collectionRate,
      dso,
      averagePaymentDelay,
      paymentMethodBreakdown,
      agingBuckets,
      topOutstandingSchools,
      recentInvoices: recentPayments.map(mapPayment),
      cashFlowTrend: groupByDate(paymentsInRange, 'paymentDate'),
      timeline: paymentsInRange.map(mapPayment),
    };
  },
};

export default financeAnalyticsService;




