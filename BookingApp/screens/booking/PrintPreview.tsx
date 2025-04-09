import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Share
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/index';
import Icon from 'react-native-vector-icons/MaterialIcons';

type PrintPreviewNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PrintPreview'
>;

type PrintPreviewRouteProp = RouteProp<
  RootStackParamList,
  'PrintPreview'
>;

interface PrintPreviewProps {
  navigation: PrintPreviewNavigationProp;
  route: PrintPreviewRouteProp;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ navigation, route }) => {
  const { html, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await Share.share({
        message: Platform.OS === 'ios' ? 'Production Schedule' : html,
        title: title || 'Production Schedule'
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  };

  const handlePrint = () => {
    // On web, we can use the browser's print functionality
    if (Platform.OS === 'web') {
      // @ts-ignore - window is available on web
      window.print();
    } else {
      // For mobile, alert that printing requires sharing first
      alert('To print, please use the Share button and select a print option from available apps.');
    }
  };

  // Add appropriate CSS for better mobile display
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 15px;
          color: #333;
        }
        h1, h2, h3 {
          color: #007bff;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        @media print {
          body {
            padding: 0;
          }
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>{title || 'Schedule Preview'}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Icon name="share" size={24} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePrint}
          >
            <Icon name="print" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#dc3545" />
          <Text style={styles.errorText}>Failed to load preview</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading preview...</Text>
            </View>
          )}
          <WebView
            source={{ html: wrappedHtml }}
            onLoad={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setError(nativeEvent.description || 'Failed to load content');
              setLoading(false);
            }}
            style={[styles.webView, loading && { height: 0 }]}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 16,
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
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#555',
  },
  errorMessage: {
    marginTop: 8,
    color: '#777',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PrintPreview;