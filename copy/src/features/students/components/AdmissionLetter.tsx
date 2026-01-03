import React from 'react';
import { StudentFormData } from './types';

interface SchoolInfo {
  name: string;
  shortName: string;
  code?: string;
}

interface AdmissionLetterProps {
  studentData: StudentFormData;
  admissionNumber: string;
  schoolInfo?: SchoolInfo;
}

const AdmissionLetter: React.FC<AdmissionLetterProps> = ({
  studentData,
  admissionNumber,
  schoolInfo
}) => {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const schoolName = schoolInfo?.name || 'Khwanzay School';
  const schoolShortName = schoolInfo?.shortName || 'Khwanzay';

  return (
    <div
      id="admission-letter"
      className="bg-white p-6 max-w-4xl mx-auto text-sm"
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.4',
        color: '#000'
      }}
    >
      {/* Simple Header Border */}
      <div className="border-4 border-double border-gray-800 p-4">
        {/* School Header - Compact */}
        <div className="text-center mb-4">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <div className="absolute inset-0 bg-blue-700 rounded-full"></div>
            <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-blue-800">{schoolShortName.substring(0, 1)}</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-1 text-gray-900">{schoolName}</h1>
          <p className="text-lg font-semibold text-gray-800" dir="rtl">د {schoolShortName} ښوونځی</p>
          <p className="text-xs text-gray-600 mt-1">Islamic Republic of Afghanistan</p>
          <div className="w-20 h-0.5 bg-gray-800 mx-auto mt-2"></div>
        </div>

        {/* Title - Compact */}
        <div className="text-center mb-3 py-2 bg-gray-100 border-y-2 border-gray-800">
          <h2 className="text-xl font-bold text-gray-900">ADMISSION LETTER</h2>
          <h3 className="text-lg font-bold text-gray-800" dir="rtl">خط شمولیت</h3>
        </div>

        {/* Admission Details - Compact */}
        <div className="mb-3 p-2 bg-gray-50 border border-gray-300">
          <div className="flex justify-between text-xs">
            <span><strong>Admission No:</strong> {admissionNumber}</span>
            <span><strong>Date:</strong> {currentDate}</span>
          </div>
        </div>

        {/* Letter Body - Compact */}
        <div className="space-y-3">
          {/* Student Information */}
          <div className="border border-gray-300 p-2">
            <h4 className="font-bold text-sm mb-2 bg-gray-800 text-white px-2 py-1">
              Student Information / د زده کوونکي معلومات
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/4">Name:</td>
                  <td className="py-1">{studentData.personal?.firstName} {studentData.personal?.lastName}</td>
                  <td className="py-1 font-semibold w-1/4 text-right" dir="rtl">نوم:</td>
                  <td className="py-1 text-right" dir="rtl">{studentData.personal?.dariName || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Father's Name:</td>
                  <td className="py-1">{studentData.father?.firstName} {studentData.father?.lastName}</td>
                  <td className="py-1 font-semibold text-right" dir="rtl">د پلار نوم:</td>
                  <td className="py-1 text-right" dir="rtl">{studentData.father?.firstName} {studentData.father?.lastName}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Tazkira No:</td>
                  <td className="py-1" colSpan={1}>
                    {studentData.personal?.tazkiraType === 'electronic' 
                      ? studentData.personal?.electronicTazkira 
                      : `${studentData.personal?.paperTazkiraNo || ''} V${studentData.personal?.paperTazkiraVolume || ''} P${studentData.personal?.paperTazkiraPage || ''}`}
                  </td>
                  <td className="py-1 font-semibold">DOB:</td>
                  <td className="py-1">{studentData.personal?.dob}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Gender:</td>
                  <td className="py-1">{studentData.personal?.gender}</td>
                  <td className="py-1 font-semibold">Asas No:</td>
                  <td className="py-1">{studentData.personal?.rollNo || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Phone:</td>
                  <td className="py-1" colSpan={3}>{studentData.personal?.phone || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Educational Details */}
          <div className="border border-gray-300 p-2">
            <h4 className="font-bold text-sm mb-2 bg-gray-800 text-white px-2 py-1">
              Educational Details / تعلیمي جزئیات
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/4">Class:</td>
                  <td className="py-1">{studentData.education?.class || '-'}</td>
                  <td className="py-1 font-semibold w-1/4">Admission Date:</td>
                  <td className="py-1">{studentData.education?.admissionDate}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Expected Fee:</td>
                  <td className="py-1">{studentData.education?.expectedFee || '-'} AFN</td>
                  <td className="py-1 font-semibold">Nationality:</td>
                  <td className="py-1">{studentData.education?.nationality}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Religion:</td>
                  <td className="py-1">{studentData.education?.religion || 'Islam'}</td>
                  <td className="py-1 font-semibold">Blood Group:</td>
                  <td className="py-1">{studentData.education?.bloodGroup || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Parent Information */}
          <div className="border border-gray-300 p-2">
            <h4 className="font-bold text-sm mb-2 bg-gray-800 text-white px-2 py-1">
              Parent/Guardian Information / د مور او پلار معلومات
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-1/4">Father's Name:</td>
                  <td className="py-1">{studentData.father?.firstName} {studentData.father?.lastName}</td>
                  <td className="py-1 font-semibold">Phone:</td>
                  <td className="py-1">{studentData.father?.phone || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Father's Tazkira:</td>
                  <td className="py-1" colSpan={3}>
                    {studentData.father?.tazkiraType === 'electronic' 
                      ? studentData.father?.electronicTazkira 
                      : `${studentData.father?.paperTazkiraNo || ''} V${studentData.father?.paperTazkiraVolume || ''} P${studentData.father?.paperTazkiraPage || ''}`}
                  </td>
                </tr>
                {studentData.mother && (
                  <>
                    <tr>
                      <td className="py-1 font-semibold">Mother's Name:</td>
                      <td className="py-1">{studentData.mother?.firstName} {studentData.mother?.lastName}</td>
                      <td className="py-1 font-semibold">Phone:</td>
                      <td className="py-1">{studentData.mother?.phone || '-'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Address */}
          <div className="border border-gray-300 p-2">
            <h4 className="font-bold text-sm mb-2 bg-gray-800 text-white px-2 py-1">
              Address / پته
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold align-top w-1/6">Current:</td>
                  <td className="py-1" colSpan={3}>
                    {studentData.address?.currentAddress || '-'}, {studentData.address?.currentDistrict || ''}, {studentData.address?.currentCity || ''}, {studentData.address?.currentProvince || ''}, {studentData.address?.currentCountry || 'Afghanistan'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold align-top">Origin:</td>
                  <td className="py-1" colSpan={3}>
                    {studentData.address?.originAddress || '-'}, {studentData.address?.originDistrict || ''}, {studentData.address?.originCity || ''}, {studentData.address?.originProvince || ''}, {studentData.address?.originCountry || 'Afghanistan'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms - Compact */}
          <div className="border border-gray-300 p-2 mt-3">
            <h4 className="font-bold text-sm mb-1 text-gray-800">Terms & Conditions / شرایط</h4>
            <ul className="text-xs space-y-0.5 list-disc list-inside">
              <li>Follow all school rules and regulations / د ښوونځي مقررات</li>
              <li>Pay fees on time / فیس په وخت ورکړئ</li>
              <li>Minimum 75% attendance required / لږ تر لږه 75% حاضري</li>
              <li>Attend meetings when called / غونډو ته راشئ</li>
            </ul>
          </div>

          {/* Signatures - School Only */}
          <div className="mt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-16 mb-1"></div>
              <div className="border-t-2 border-gray-900 pt-1">
                <p className="font-bold">Principal's Signature</p>
                <p dir="rtl">د مدیر لاسلیک</p>
                <p className="text-xs text-gray-500 mt-1">Date: ___________</p>
              </div>
            </div>
            <div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-2 border-gray-800 flex items-center justify-center mb-1">
                  <div className="text-center">
                    <p className="text-xs font-bold">OFFICIAL</p>
                    <p className="text-sm font-bold">SEAL</p>
                    <p className="text-xs" dir="rtl">مهر</p>
                  </div>
                </div>
                <p className="font-semibold mt-1">School Stamp</p>
                <p dir="rtl" className="text-xs">د ښوونځي مهر</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="mt-3 pt-2 border-t border-gray-400 text-center text-xs text-gray-600">
          <p>Official document from {schoolName} | د {schoolName} رسمي سند</p>
        </div>
      </div>
    </div>
  );
};

export default AdmissionLetter;

