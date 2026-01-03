import React from 'react';
import { Platform } from 'react-native';

// Platform-specific imports
let VictoryChart: any;
let VictoryBar: any;
let VictoryPie: any;
let VictoryLine: any;
let VictoryAxis: any;
let VictoryTheme: any;
let VictoryLabel: any;
let VictoryTooltip: any;
let VictoryArea: any;
let Svg: any;

if (Platform.OS === 'web') {
  // Web-compatible chart library (using recharts or similar)
  // For now, we'll use a simple div-based chart
  VictoryChart = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  VictoryBar = ({ data, ...props }: any) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px' }}>
      {data?.map((item: any, index: number) => (
        <div
          key={index}
          style={{
            width: '20px',
            height: `${(item.y / Math.max(...data.map((d: any) => d.y))) * 180}px`,
            backgroundColor: '#3B82F6',
            margin: '2px',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
  VictoryPie = ({ data, ...props }: any) => (
    <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#3B82F6' }}>
      <div style={{ textAlign: 'center', paddingTop: '80px', color: 'white' }}>
        {data?.length || 0} items
      </div>
    </div>
  );
  VictoryLine = ({ data, ...props }: any) => (
    <div style={{ height: '200px', border: '1px solid #ccc', position: 'relative' }}>
      {data?.map((item: any, index: number) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${(item.x / Math.max(...data.map((d: any) => d.x))) * 100}%`,
            bottom: `${(item.y / Math.max(...data.map((d: any) => d.y))) * 100}%`,
            width: '4px',
            height: '4px',
            backgroundColor: '#3B82F6',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
  VictoryAxis = ({ ...props }: any) => <div />;
  VictoryTheme = { material: {} };
  VictoryLabel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  VictoryTooltip = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  VictoryArea = ({ data, ...props }: any) => (
    <div style={{ height: '200px', backgroundColor: 'rgba(59, 130, 246, 0.3)' }}>
      {data?.map((item: any, index: number) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${(item.x / Math.max(...data.map((d: any) => d.x))) * 100}%`,
            bottom: `${(item.y / Math.max(...data.map((d: any) => d.y))) * 100}%`,
            width: '4px',
            height: '4px',
            backgroundColor: '#3B82F6',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
  Svg = ({ children, ...props }: any) => <div {...props}>{children}</div>;
} else {
  // Mobile - use Victory Native
  try {
    const victoryNative = require('victory-native');
    VictoryChart = victoryNative.VictoryChart;
    VictoryBar = victoryNative.VictoryBar;
    VictoryPie = victoryNative.VictoryPie;
    VictoryLine = victoryNative.VictoryLine;
    VictoryAxis = victoryNative.VictoryAxis;
    VictoryTheme = victoryNative.VictoryTheme;
    VictoryLabel = victoryNative.VictoryLabel;
    VictoryTooltip = victoryNative.VictoryTooltip;
    VictoryArea = victoryNative.VictoryArea;
    Svg = require('react-native-svg').default;
  } catch (error) {
    // Fallback for mobile if Victory Native is not available
    VictoryChart = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    VictoryBar = ({ data, ...props }: any) => (
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px' }}>
        {data?.map((item: any, index: number) => (
          <div
            key={index}
            style={{
              width: '20px',
              height: `${(item.y / Math.max(...data.map((d: any) => d.y))) * 180}px`,
              backgroundColor: '#3B82F6',
              margin: '2px',
              borderRadius: '2px',
            }}
          />
        ))}
      </div>
    );
    VictoryPie = ({ data, ...props }: any) => (
      <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#3B82F6' }}>
        <div style={{ textAlign: 'center', paddingTop: '80px', color: 'white' }}>
          {data?.length || 0} items
        </div>
      </div>
    );
    VictoryLine = ({ data, ...props }: any) => (
      <div style={{ height: '200px', border: '1px solid #ccc', position: 'relative' }}>
        {data?.map((item: any, index: number) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${(item.x / Math.max(...data.map((d: any) => d.x))) * 100}%`,
              bottom: `${(item.y / Math.max(...data.map((d: any) => d.y))) * 100}%`,
              width: '4px',
              height: '4px',
              backgroundColor: '#3B82F6',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    );
    VictoryAxis = ({ ...props }: any) => <div />;
    VictoryTheme = { material: {} };
    VictoryLabel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    VictoryTooltip = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    VictoryArea = ({ data, ...props }: any) => (
      <div style={{ height: '200px', backgroundColor: 'rgba(59, 130, 246, 0.3)' }}>
        {data?.map((item: any, index: number) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${(item.x / Math.max(...data.map((d: any) => d.x))) * 100}%`,
              bottom: `${(item.y / Math.max(...data.map((d: any) => d.y))) * 100}%`,
              width: '4px',
              height: '4px',
              backgroundColor: '#3B82F6',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    );
    Svg = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  }
}

export {
  VictoryChart,
  VictoryBar,
  VictoryPie,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryLabel,
  VictoryTooltip,
  VictoryArea,
  Svg,
}; 
