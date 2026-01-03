import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTranslation } from '../../contexts/TranslationContext';

interface RtlViewProps extends ViewProps {
  children: React.ReactNode;
  row?: boolean; // If true, applies row or row-reverse
  style?: any;
}

const RtlView: React.FC<RtlViewProps> = ({ children, row, style, ...rest }) => {
  const { lang } = useTranslation();
  const isRtl = lang === 'fa' || lang === 'ps';

  return (
    <View
      style={[
        isRtl && styles.rtl,
        row && (isRtl ? styles.rowReverse : styles.row),
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  rtl: {
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});

export default RtlView; 
