import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

interface AddFileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newFile: any) => void;
  folderId: string | null;
  onSubmit: (payload: any) => Promise<void>;
}

const AddFileModal: React.FC<AddFileModalProps> = ({ visible, onClose, onSuccess, folderId, onSubmit }) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [resource, setResource] = useState('');
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState('');
  const [file, setFile] = useState<any>(null);
  const [type, setType] = useState('');

  useEffect(() => {
    if (!visible) {
      setName('');
      setPath('');
      setResource('');
      setDestination('');
      setStatus('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name || !folderId) return;

    const payload = {
      name,
      path,
      resource,
      destination,
      status,
      folderId,
      fileName: file?.name || '',
      fileType: type,
      uri: file?.uri || '',
    };

    try {
      await onSubmit(payload);
      onSuccess(payload);
      onClose();
    } catch (err) {
      
    }
  };

  const handlePickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

    if (result.type === 'cancel') {

      return;
    }

    // result.type === 'success'

    // onClose();
  } catch (error) {
    
  }
}

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add New File</Text>
          <Text style={styles.label}>File name</Text>
          <TextInput placeholder="File name" value={name} onChangeText={setName} style={styles.input} />
          <Text style={styles.label}>Path</Text>
          <TextInput placeholder="Path" value={path} onChangeText={setPath} style={styles.input} />
          <Text style={styles.label}>Resource</Text>
          <TextInput placeholder="Resource" value={resource} onChangeText={setResource} style={styles.input} />
          <Text style={styles.label}>Destination</Text>
          <TextInput placeholder="Destination" value={destination} onChangeText={setDestination} style={styles.input} />
          <Text style={styles.label}>Choose File</Text>
          <TouchableOpacity onPress={handlePickFile} style={styles.input}>
            <Text>{file ? file.name : 'Tap to select a file'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>File Type</Text>
          <TextInput
            placeholder="Type (e.g., pdf, doc, image)"
            value={type}
            onChangeText={setType}
            style={styles.input}
          />
          <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
            <TouchableOpacity
                style={[styles.statusBox, status === 'active' && styles.statusBoxActive]}
                onPress={() => setStatus('active')}
            >
                <Text style={[styles.statusText, status === 'active' && styles.statusTextActive]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.statusBox, status === 'inactive' && styles.statusBoxActive]}
                onPress={() => setStatus('inactive')}
            >
                <Text style={[styles.statusText, status === 'inactive' && styles.statusTextActive]}>Inactive</Text>
            </TouchableOpacity>
            </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddFileModal;

// styles omitted for brevity

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    width: '50%',
    borderRadius: 12,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  submit: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  cancel: {
    flex: 1,
    backgroundColor: '#ddd',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  label: {
  marginBottom: 6,
  fontSize: 14,
  fontWeight: '600',
  color: '#555',
},

statusContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
},

statusBox: {
  flex: 1,
  paddingVertical: 10,
  marginHorizontal: 5,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  backgroundColor: '#f0f0f0',
  alignItems: 'center',
},

statusBoxActive: {
  backgroundColor: '#CECFFA',
  borderColor: '#6366F1',
},

statusText: {
  color: '#333',
  fontWeight: '500',
},

statusTextActive: {
  fontWeight: 'bold',
},
});
