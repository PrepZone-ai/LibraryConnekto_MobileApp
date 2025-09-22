import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB, Portal, useTheme } from 'react-native-paper';

interface CustomFABProps {
  open: boolean;
  onStateChange: (state: { open: boolean }) => void;
  onAddStudent: () => void;
  onBulkUpload: () => void;
  style?: any;
}

const CustomFAB: React.FC<CustomFABProps> = ({
  open,
  onStateChange,
  onAddStudent,
  onBulkUpload,
  style,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible
        icon={open ? 'close' : 'plus'}
        color="white"
        fabStyle={styles.fabStyle}
        actions={[
          {
            icon: 'account-plus',
            label: 'Add Single Student',
            onPress: () => {
              onAddStudent();
              onStateChange({ open: false });
            },
            labelTextColor: theme.colors.primary,
          },
          {
            icon: 'file-upload',
            label: 'Bulk Upload',
            onPress: () => {
              onBulkUpload();
              onStateChange({ open: false });
            },
            labelTextColor: theme.colors.primary,
          },
        ]}
        onStateChange={onStateChange}
        style={[styles.fab, style]}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  fab: {
    paddingBottom: 65,
  },
  fabStyle: {
    backgroundColor: '#6200ee',
  },
});

export default CustomFAB;
