import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

interface QuantumParticle {
  position: number[];
  velocity: number[];
  phase: number[];
  entanglement: number[];
  personalBest: {
    position: number[];
    fitness: number;
  };
  currentFitness: number;
}

interface SwarmState {
  particles: QuantumParticle[];
  globalBest: {
    position: number[];
    fitness: number;
  };
  entanglementMatrix: number[][];
  quantumState: {
    superposition: number[];
    interference: number[];
    coherence: number;
  };
}

interface ObjectiveFunction {
  id: string;
  name: string;
  weight: number;
  target: 'minimize' | 'maximize';
  constraints: {
    min?: number;
    max?: number;
    type: 'hard' | 'soft';
  };
}

interface SwarmMetrics {
  convergence: {
    rate: number;
    stability: number;
    diversity: number;
  };
  quantum: {
    entanglementStrength: number;
    coherenceQuality: number;
    interferencePattern: number[];
    quantumSpeedup: number;
  };
  performance: {
    bestFitness: number;
    averageFitness: number;
    fitnessVariance: number;
    explorationRate: number;
  };
  objectives: {
    id: string;
    value: number;
    improvement: number;
    constraintSatisfaction: number;
  }[];
}

interface SwarmConfig {
  swarm: {
    numParticles: number;
    dimensions: number;
    topology: 'global' | 'ring' | 'adaptive';
  };
  quantum: {
    entanglementStrength: number;
    phaseUpdateRate: number;
    interferenceThreshold: number;
    measurementStrategy: 'collapse' | 'weak' | 'adaptive';
  };
  optimization: {
    inertiaWeight: number;
    cognitiveCoefficient: number;
    socialCoefficient: number;
    quantumFactor: number;
    adaptiveParameters: boolean;
  };
  objectives: ObjectiveFunction[];
  constraints: {
    maxIterations: number;
    convergenceThreshold: number;
    diversityThreshold: number;
  };
}

class QuantumSwarmOptimizer {
  private config: SwarmConfig;
  private state: SwarmState;
  private metrics: SwarmMetrics;
  private iteration: number;

  constructor(config: SwarmConfig) {
    this.config = config;
    this.iteration = 0;
    this.state = this.initializeSwarm();
    this.metrics = this.initializeMetrics();
  }

  private initializeSwarm(): SwarmState {
    const particles = Array(this.config.swarm.numParticles)
      .fill(null)
      .map(() => this.createQuantumParticle());

    const globalBest = {
      position: new Array(this.config.swarm.dimensions).fill(0),
      fitness: -Infinity,
    };

    return {
      particles,
      globalBest,
      entanglementMatrix: this.initializeEntanglementMatrix(),
      quantumState: {
        superposition: new Array(this.config.swarm.dimensions).fill(0),
        interference: new Array(this.config.swarm.dimensions).fill(0),
        coherence: 1,
      },
    };
  }

  private createQuantumParticle(): QuantumParticle {
    const position = Array(this.config.swarm.dimensions)
      .fill(0)
      .map(() => Math.random());

    return {
      position,
      velocity: Array(this.config.swarm.dimensions).fill(0),
      phase: Array(this.config.swarm.dimensions)
        .fill(0)
        .map(() => Math.random() * 2 * Math.PI),
      entanglement: Array(this.config.swarm.dimensions)
        .fill(0)
        .map(() => Math.random() * this.config.quantum.entanglementStrength),
      personalBest: {
        position: [...position],
        fitness: -Infinity,
      },
      currentFitness: -Infinity,
    };
  }

  private initializeEntanglementMatrix(): number[][] {
    const size = this.config.swarm.numParticles;
    return Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(0)
          .map((_, j) => (j === size - 1 ? 0 : Math.random() * this.config.quantum.entanglementStrength))
      );
  }

  private initializeMetrics(): SwarmMetrics {
    return {
      convergence: {
        rate: 0,
        stability: 0,
        diversity: 1,
      },
      quantum: {
        entanglementStrength: 0,
        coherenceQuality: 1,
        interferencePattern: new Array(this.config.swarm.dimensions).fill(0),
        quantumSpeedup: 0,
      },
      performance: {
        bestFitness: -Infinity,
        averageFitness: 0,
        fitnessVariance: 0,
        explorationRate: 1,
      },
      objectives: this.config.objectives.map((obj) => ({
        id: obj.id,
        value: 0,
        improvement: 0,
        constraintSatisfaction: 1,
      })),
    };
  }

  private evaluateParticle(particle: QuantumParticle): number {
    return this.config.objectives.reduce((totalFitness, objective) => {
      const value = this.calculateObjectiveValue(particle, objective);
      const normalizedValue = this.normalizeObjectiveValue(value, objective);
      const weightedValue = normalizedValue * objective.weight;

      return totalFitness + weightedValue;
    }, 0);
  }

  private calculateObjectiveValue(particle: QuantumParticle, objective: ObjectiveFunction): number {
    const quantumState = this.collapseQuantumState(particle);
    return this.objectiveFunction(quantumState, objective);
  }

  private collapseQuantumState(particle: QuantumParticle): number[] {
    return particle.position.map((pos, i) => {
      const phase = particle.phase[i];
      const entanglement = particle.entanglement[i];
      const interference = this.state.quantumState.interference[i];

      const amplitude = Math.sqrt(pos * pos + entanglement * entanglement);
      const probability = amplitude * Math.cos(phase + interference);

      switch (this.config.quantum.measurementStrategy) {
        case 'collapse':
          return Math.random() < probability * probability ? 1 : 0;
        case 'weak':
          return probability;
        case 'adaptive':
          return this.metrics.convergence.stability > 0.8 ? probability : Math.random() < probability * probability ? 1 : 0;
        default:
          return probability;
      }
    });
  }

  private objectiveFunction(state: number[], objective: ObjectiveFunction): number {
    switch (objective.id) {
      case 'exploration':
        return this.calculateExplorationScore(state);
      case 'exploitation':
        return this.calculateExploitationScore(state);
      case 'balance':
        return this.calculateBalanceScore(state);
      default:
        return 0;
    }
  }

  private calculateExplorationScore(state: number[]): number {
    const diversity = state.reduce((sum, val) => sum + Math.abs(val - 0.5), 0) / state.length;
    return diversity;
  }

  private calculateExploitationScore(state: number[]): number {
    const convergence = state.reduce((sum, val) => sum + Math.pow(val - this.state.globalBest.position[0], 2), 0);
    return 1 / (1 + convergence);
  }

  private calculateBalanceScore(state: number[]): number {
    const exploration = this.calculateExplorationScore(state);
    const exploitation = this.calculateExploitationScore(state);
    return Math.sqrt(exploration * exploitation);
  }

  private normalizeObjectiveValue(value: number, objective: ObjectiveFunction): number {
    const { min = 0, max = 1 } = objective.constraints;
    const normalized = (value - min) / (max - min);
    return objective.target === 'maximize' ? normalized : 1 - normalized;
  }

  private updateParticleVelocity(particle: QuantumParticle, index: number): void {
    const { inertiaWeight, cognitiveCoefficient, socialCoefficient, quantumFactor } = this.config.optimization;

    particle.velocity = particle.velocity.map((vel, i) => {
      const cognitive = cognitiveCoefficient * Math.random() * (particle.personalBest.position[i] - particle.position[i]);
      const social = socialCoefficient * Math.random() * (this.state.globalBest.position[i] - particle.position[i]);
      const quantum = quantumFactor * this.calculateQuantumEffect(particle, i, index);

      return inertiaWeight * vel + cognitive + social + quantum;
    });
  }

  private calculateQuantumEffect(particle: QuantumParticle, dimension: number, particleIndex: number): number {
    const entanglementEffect = this.state.entanglementMatrix[particleIndex].reduce(
      (sum, strength, j) => sum + strength * this.state.particles[j].position[dimension],
      0
    );

    const interferenceEffect = this.state.quantumState.interference[dimension];
    const coherenceEffect = this.state.quantumState.coherence * particle.phase[dimension];

    return (entanglementEffect + interferenceEffect + coherenceEffect) / 3;
  }

  private updateParticlePosition(particle: QuantumParticle): void {
    particle.position = particle.position.map((pos, i) => {
      const newPos = pos + particle.velocity[i];
      return Math.max(0, Math.min(1, newPos));
    });
  }

  private updateQuantumState(): void {
    // Update interference pattern
    this.state.quantumState.interference = this.state.particles.reduce(
      (interference, particle) =>
        interference.map((int, i) => int + particle.phase[i] * particle.entanglement[i]),
      new Array(this.config.swarm.dimensions).fill(0)
    ).map(int => int / this.config.swarm.numParticles);

    // Update coherence
    const phaseAlignment = this.state.particles.reduce(
      (sum, particle) =>
        sum + particle.phase.reduce((s, phase) => s + Math.cos(phase), 0) / particle.phase.length,
      0
    ) / this.config.swarm.numParticles;

    this.state.quantumState.coherence = Math.abs(phaseAlignment);

    // Update superposition
    this.state.quantumState.superposition = this.state.particles.reduce(
      (superposition, particle) =>
        superposition.map((sup, i) => sup + particle.position[i] * particle.entanglement[i]),
      new Array(this.config.swarm.dimensions).fill(0)
    ).map(sup => sup / this.config.swarm.numParticles);
  }

  private updateMetrics(): void {
    const fitnesses = this.state.particles.map(p => p.currentFitness);
    const avgFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;

    // Update performance metrics
    this.metrics.performance.bestFitness = this.state.globalBest.fitness;
    this.metrics.performance.averageFitness = avgFitness;
    this.metrics.performance.fitnessVariance = fitnesses.reduce(
      (variance, fitness) => variance + Math.pow(fitness - avgFitness, 2),
      0
    ) / fitnesses.length;

    // Update convergence metrics
    this.metrics.convergence.rate = (this.metrics.performance.bestFitness - this.metrics.performance.averageFitness) /
      Math.abs(this.metrics.performance.bestFitness);
    this.metrics.convergence.stability = 1 - this.metrics.performance.fitnessVariance;
    this.metrics.convergence.diversity = this.calculateSwarmDiversity();

    // Update quantum metrics
    this.metrics.quantum.entanglementStrength = this.calculateEntanglementStrength();
    this.metrics.quantum.coherenceQuality = this.state.quantumState.coherence;
    this.metrics.quantum.interferencePattern = [...this.state.quantumState.interference];
    this.metrics.quantum.quantumSpeedup = this.calculateQuantumSpeedup();

    // Update objective metrics
    this.updateObjectiveMetrics();
  }

  private calculateSwarmDiversity(): number {
    const centroid = this.state.particles[0].position.map((_, dim) =>
      this.state.particles.reduce((sum, p) => sum + p.position[dim], 0) / this.state.particles.length
    );

    const averageDistance = this.state.particles.reduce(
      (sum, particle) =>
        sum +
        Math.sqrt(
          particle.position.reduce((s, pos, i) => s + Math.pow(pos - centroid[i], 2), 0)
        ),
      0
    ) / this.state.particles.length;

    return averageDistance;
  }

  private calculateEntanglementStrength(): number {
    return this.state.entanglementMatrix.reduce(
      (sum, row) => sum + row.reduce((s, val) => s + val, 0),
      0
    ) / (this.config.swarm.numParticles * this.config.swarm.numParticles);
  }

  private calculateQuantumSpeedup(): number {
    const classicalIterations = this.iteration * this.config.swarm.numParticles;
    const quantumIterations = this.iteration * Math.sqrt(this.config.swarm.numParticles);
    return classicalIterations / quantumIterations;
  }

  private updateObjectiveMetrics(): void {
    this.metrics.objectives = this.config.objectives.map(objective => {
      const value = this.calculateObjectiveValue(this.state.particles[0], objective);
      const previousValue = this.metrics.objectives.find(obj => obj.id === objective.id)?.value || 0;

      return {
        id: objective.id,
        value,
        improvement: (value - previousValue) / Math.abs(previousValue || 1),
        constraintSatisfaction: this.calculateConstraintSatisfaction(value, objective),
      };
    });
  }

  private calculateConstraintSatisfaction(value: number, objective: ObjectiveFunction): number {
    const { min, max, type } = objective.constraints;
    let satisfaction = 1;

    if (min !== undefined && value < min) {
      satisfaction -= type === 'hard' ? 1 : (min - value) / min;
    }
    if (max !== undefined && value > max) {
      satisfaction -= type === 'hard' ? 1 : (value - max) / max;
    }

    return Math.max(0, satisfaction);
  }

  public optimize(): SwarmMetrics {
    this.state.particles.forEach((particle, index) => {
      // Update particle's quantum properties
      this.updateParticleVelocity(particle, index);
      this.updateParticlePosition(particle);

      // Evaluate fitness
      particle.currentFitness = this.evaluateParticle(particle);

      // Update personal best
      if (particle.currentFitness > particle.personalBest.fitness) {
        particle.personalBest = {
          position: [...particle.position],
          fitness: particle.currentFitness,
        };
      }

      // Update global best
      if (particle.currentFitness > this.state.globalBest.fitness) {
        this.state.globalBest = {
          position: [...particle.position],
          fitness: particle.currentFitness,
        };
      }
    });

    this.updateQuantumState();
    this.updateMetrics();
    this.iteration++;

    return this.metrics;
  }

  public getState(): SwarmState {
    return this.state;
  }

  public getMetrics(): SwarmMetrics {
    return this.metrics;
  }

  public getIteration(): number {
    return this.iteration;
  }
}

export interface OptimizationState {
  swarmState: SwarmState;
  metrics: SwarmMetrics;
  iteration: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export default function useQuantumSwarm(initialConfig?: Partial<SwarmConfig>) {
  const queryClient = useQueryClient();
  const [optimizer, setOptimizer] = React.useState<QuantumSwarmOptimizer | null>(null);

  const defaultConfig: SwarmConfig = {
    swarm: {
      numParticles: 50,
      dimensions: 30,
      topology: 'adaptive',
    },
    quantum: {
      entanglementStrength: 0.7,
      phaseUpdateRate: 0.1,
      interferenceThreshold: 0.3,
      measurementStrategy: 'adaptive',
    },
    optimization: {
      inertiaWeight: 0.7,
      cognitiveCoefficient: 1.5,
      socialCoefficient: 1.5,
      quantumFactor: 0.3,
      adaptiveParameters: true,
    },
    objectives: [
      {
        id: 'exploration',
        name: 'Search Space Exploration',
        weight: 0.4,
        target: 'maximize',
        constraints: {
          min: 0,
          max: 1,
          type: 'soft',
        },
      },
      {
        id: 'exploitation',
        name: 'Local Optimization',
        weight: 0.3,
        target: 'maximize',
        constraints: {
          min: 0,
          max: 1,
          type: 'soft',
        },
      },
      {
        id: 'balance',
        name: 'Exploration-Exploitation Balance',
        weight: 0.3,
        target: 'maximize',
        constraints: {
          min: 0.4,
          max: 1,
          type: 'hard',
        },
      },
    ],
    constraints: {
      maxIterations: 1000,
      convergenceThreshold: 1e-6,
      diversityThreshold: 0.1,
    },
  };

  const config = { ...defaultConfig, ...initialConfig };

  const { data: optimizationState, error } = useQuery<OptimizationState, Error>(
    ['quantumSwarm', config],
    async () => {
      if (!optimizer) {
        setOptimizer(new QuantumSwarmOptimizer(config));
        return {
          swarmState: optimizer?.getState() || null,
          metrics: optimizer?.getMetrics() || null,
          iteration: 0,
          status: 'idle',
        };
      }

      const metrics = optimizer.optimize();
      return {
        swarmState: optimizer.getState(),
        metrics,
        iteration: optimizer.getIteration(),
        status: 'running',
      };
    },
    {
      refetchInterval: 1000,
      enabled: !!optimizer,
    }
  );

  const optimize = useMutation(
    async () => {
      if (!optimizer) return null;
      return optimizer.optimize();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quantumSwarm']);
      },
    }
  );

  const reset = useCallback(() => {
    setOptimizer(new QuantumSwarmOptimizer(config));
    queryClient.invalidateQueries(['quantumSwarm']);
  }, [config, queryClient]);

  return {
    optimizationState: optimizationState || {
      swarmState: null,
      metrics: null,
      iteration: 0,
      status: 'idle',
    },
    error,
    optimize: optimize.mutate,
    reset,
    isLoading: optimize.isLoading,
  };
}
