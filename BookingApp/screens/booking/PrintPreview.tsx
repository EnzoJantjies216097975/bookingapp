import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../../types';

type PrintPreviewNavigationProp = StackNavigationProp
  RootStackParamList,
  'PrintPreview'
>;

type PrintPreviewRouteProp = RouteProp
  RootStackParamList,
  'PrintPreview'
>;

interface PrintPreviewProps {
  navigation: PrintPreviewNavigationProp;
  route: PrintPreviewRouteProp;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ navigation, route }) => {
  const { html, title } = route.params;
  const [loading, setLoading] = useState<boolean>(true);
  
  const handleShare = async () => {
    try {
      // For a proper implementation, you would save the HTML to a file
      // and share the file, but for simplicity, we're just sharing the title
      await Share.share({
        message: `TV Broadcasting Schedule: ${title}`,
        title: title
      });
    } catch (error) {
      console.error('Error sharing schedule:', error);
    }
  };
  
  const handlePrint = () => {
    // In a real app, you would implement actual printing here
    // This would likely involve a native module or a third-party library
    // For simplicity, we'll just show a message
    alert('Printing functionality would be implemented here with a native printing module');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}
        
        <WebView
          source={{ html }}
          style={styles.webView}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
      
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#555" />
          <Text style={styles.actionButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Icon name="share" size={24} color="#555" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrint}
        >
          <Icon name="print" size={24} color="white" />
          <Text style={[styles.actionButtonText, styles.printButtonText]}>Print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    color: '#555',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#555',
  },
  printButton: {
    backgroundColor: '#007bff',
  },
  printButtonText: {
    color: 'white',
  },
});

export default PrintPreview;