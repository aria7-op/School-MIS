import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AddFileModal from './components/AddFileModel';
import { useTheme } from '@react-navigation/native';
import secureApiService from '../../services/secureApiService';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

const DocumentsScreen: React.FC = () => {
  const { colors, dark } = useTheme();
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);

  const [showAddFile, setShowAddFile] = useState(false);
  const [selectedFolderForFile, setSelectedFolderForFile] = useState<string | null>(null);

  const [fileStructure, setFileStructure] = useState<FileItem[]>([
    {
      id: 'folder1',
      name: 'Financial Documents',
      type: 'folder',
      children: [
        { id: 'file1', name: 'Q1 Report.xlsx', type: 'file' },
        { id: 'file2', name: 'Q2 Report.xlsx', type: 'file' },
      ],
    },
    {
      id: 'folder2',
      name: 'Project Files',
      type: 'folder',
      children: [
        { id: 'file3', name: 'Project Plan.xlsx', type: 'file' },
        { id: 'file4', name: 'Budget.xlsx', type: 'file' },
      ],
    },
  ]);

  const toggleFolder = (folderId: string) => {
    const updated = new Set(expandedFolders);
    if (updated.has(folderId)) {
      updated.delete(folderId);
    } else {
      updated.add(folderId);
    }
    setExpandedFolders(updated);
  };

  const handleFileSelect = (fileItem: FileItem) => {
    if (fileItem.type === 'file') {
      setSelectedFile(fileItem);
    }
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      children: [],
    };

    setFileStructure([...fileStructure, newFolder]);
    setNewFolderName('');
    setShowAddFolder(false);
    setExpandedFolders(new Set([...expandedFolders, newFolder.id]));
  };

  const handleAddFileApi = async (payload: any) => {
    try {
      const response = await secureApiService.post('/documents', payload);
      // Optionally, you can use response.data if you want to update fileStructure with the server response
    } catch (err) {
      
      // Optionally, show an error to the user
    }
  };

  const handleAddFile = () => {
    if (!newFileName.trim() || !selectedFolderForFile) return;

    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name: newFileName.endsWith('.xlsx') ? newFileName : `${newFileName}.xlsx`,
      type: 'file',
    };

    setFileStructure(fileStructure.map(folder => {
      if (folder.id === selectedFolderForFile) {
        return {
          ...folder,
          children: [...(folder.children || []), newFile],
        };
      }
      return folder;
    }));

    setNewFileName('');
    setShowAddFile(false);
  };

  const renderFileItem = (item: FileItem) => {
    if (item.type === 'folder') {
      return (
        <View key={item.id} style={{ marginLeft: 16 }}>
          <TouchableOpacity
            style={styles.folder}
            onPress={() => toggleFolder(item.id)}
          >
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name={expandedFolders.has(item.id) ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
                  size={20}
                  color={colors.text}
                />
                <MaterialIcons name="folder" size={20} color={colors.primary} style={{ marginHorizontal: 4 }} />
                <Text>{item.name}</Text>
              </View>
            <TouchableOpacity onPress={() => {
              setSelectedFolderForFile(item.id);
              setShowAddFile(true);
            }}>
              <Text style={styles.addFileBtn}>+ File</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {expandedFolders.has(item.id) && item.children?.map(child => renderFileItem(child))}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.file,
          selectedFile?.id === item.id && styles.selectedFile
        ]}
        onPress={() => handleFileSelect(item)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.text} />
          <Text style={{ marginLeft: 6 }}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {/* Left Panel */}
      <View style={styles.leftPane}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <TouchableOpacity style={styles.addFolderBtn} onPress={() => setShowAddFolder(true)}>
            <Text style={styles.addFolderText}>+ Add Folder</Text>
          </TouchableOpacity>

          {showAddFolder && (
            <View style={styles.formBox}>
              <TextInput
                placeholder="Folder name"
                value={newFolderName}
                onChangeText={setNewFolderName}
                style={styles.input}
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.createBtn} onPress={handleAddFolder}>
                  <Text style={styles.btnText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddFolder(false)}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {fileStructure.map(item => renderFileItem(item))}
        </ScrollView>
      </View>

      {/* Right Panel */}
      <View style={styles.rightPane}>
        {selectedFile ? (
          <View style={{ padding: 16 }}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.placeholder}>File content would be shown here.</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholder}>Select a file to view contents</Text>
          </View>
        )}
      </View>

      <AddFileModal
          visible={showAddFile}
          onClose={() => setShowAddFile(false)}
          folderId={selectedFolderForFile}
          onSuccess={(newFile) => {
            setFileStructure(prev =>
              prev.map(folder =>
                folder.id === selectedFolderForFile
                  ? { ...folder, children: [...(folder.children || []), newFile] }
                  : folder
              )
            );
          }}
          onSubmit={handleAddFileApi}
        />
    </View>
  );
};

export default DocumentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width:'95%',
    marginTop:60
  },
  leftPane: {
    width: 280,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addFolderBtn: {
    padding: 8,
    backgroundColor: '#6366F1',
    borderRadius: 6,
    marginBottom: 12,
  },
  addFolderText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formBox: {
    backgroundColor: '#fff',
    padding:8,
    borderRadius: 6,
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createBtn: {
    backgroundColor: '#6366F1',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 4,
  },
  cancelBtn: {
    backgroundColor: '#ddd',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginLeft: 4,
  },
  btnText: {
    color: 'white',
    textAlign: 'center',
  },
  sectionTitle: {
    marginVertical: 8,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#555',
  },
  folder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 4,
  },
  addFileBtn: {
    fontSize: 12,
    color: '#6366F1',
  },
  file: {
    marginLeft: 32,
    paddingVertical: 4,
  },
  selectedFile: {
    backgroundColor: '#e0e0e0',
  },
  fileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
});
