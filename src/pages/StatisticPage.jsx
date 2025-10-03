import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import styled from "styled-components";
import { DataGrid } from "react-data-grid";
// import ToastComponent from "../components/Toast";
// import { useToast } from "../hooks/useToast";
import { useAuthRedux } from "../hooks/useAuthRedux.js";
import { getSalesData, parseTsvFile } from "../services/tsvService.js";
import { useStore } from "../store/index.js";

const Container = styled.div`
  background: #f3f4f6;
  padding: 20px 20px 0 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-weight: 700;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  &:hover { 
    background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }
  &:disabled { 
    opacity: 0.6; 
    cursor: not-allowed;
    transform: none;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ContentArea = styled.div`
  padding: 0 20px 20px 20px;
  min-height: 400px;
  position: relative;
`;


// DropZone for View tab (no data state)
const DropZoneView = styled.div`
  height: calc(80vh - 112px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px dashed #0ea5e9;
  border-radius: 16px;
  padding: 48px 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  color: #1e40af;
`;

// DropZone for Upload tab (drag & drop)
const DropZoneUpload = styled.div`
  height: calc(80vh - 112px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px dashed #3b82f6;
  border-radius: 16px;
  padding: 48px 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  color: #1e40af;
  
  &:hover {
    border-color: #2563eb;
    background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  }
`;

// Content wrapper for DropZones
const DropZoneContent = styled.div`
  text-align: center;
  position: relative;
  z-index: 2;
`;

// Animated emoji
const DropZoneEmoji = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  filter: ${props => props.filter || 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))'};
  animation: ${props => props.animation || 'bounce'} 2s infinite;
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
`;

// Heading text
const DropZoneHeading = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${props => props.color || '#1e40af'};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// Subtitle text
const DropZoneSubtitle = styled.div`
  font-size: 16px;
  color: #64748b;
  margin-bottom: 8px;
`;

// Hint badge
const DropZoneHint = styled.div`
  font-size: 14px;
  color: ${props => props.color || '#3b82f6'};
  font-weight: 600;
  padding: 8px 16px;
  background: ${props => props.background || 'rgba(59, 130, 246, 0.1)'};
  border-radius: 20px;
  display: inline-block;
  margin-top: 8px;
`;

// Tab system styles - Simple color change
const TabContainer = styled.div`
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
  width: fit-content;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  border: none;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
    : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#64748b'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex: 1;
  border-radius: 6px;
  
  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
      : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'};
    color: ${props => props.active ? '#ffffff' : '#3b82f6'};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TabText = styled.div`
  color: inherit;
  font-weight: inherit;
  transition: all 0.3s ease;
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  animation: ${props => props.active ? 'fadeInUp 0.4s ease-out' : 'none'};
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 16px;
  text-align: center;
  padding: 40px;
`;

const LoadingContainer = styled.div`
  height: calc(100vh - 320px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  margin: 20px 0;
  border: 2px solid #e2e8f0;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LoadingSubtitle = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 16px;
  text-align: center;
  padding: 40px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.2;
`;

const ExportButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 700;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-left: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  &:hover { 
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }
`;

const PaginationInfo = styled.div`
  width: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  
  strong {
    color: #1e40af;
    font-weight: 700;
  }
`;

const InfiniteScrollLoader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  color: #3b82f6;
  font-weight: 600;
`;

const MiniSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const InlineLoader = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid #cbd5e1;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin: 0 2px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
`;

const FilterInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  min-width: 250px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #374151;
  font-weight: 500;
  transition: all 0.3s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }
  &::placeholder {
    color: #9ca3af;
    font-style: italic;
  }
`;

const DataGridContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  width: 100%;
  height: calc(100vh - 350px);
  display: flex;
  flex-direction: column;
  
  .rdg {
    border: none;
    font-family: inherit;
    --rdg-background-color: white;
    --rdg-header-background-color: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    --rdg-row-hover-background-color: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    --rdg-border-color: #f1f5f9;
    --rdg-selection-color: transparent;
    /* Let react-data-grid manage column widths to avoid header/body misalignment */
  }
  
  .rdg *:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  
  .rdg-header-row {
    background: #ffffff;
    border-bottom: 2px solid #3b82f6;
    height: 50px;
    position: sticky;
    top: 0;
    z-index: 10;
    margin-bottom: 0;
  }
  
  .rdg-header-cell {
    font-weight: 700;
    color: #1e40af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 13px;
    padding: 8px 12px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }
  
  .rdg-row {
    transition: all 0.2s ease;
    height: 60px;
  }
  
  .rdg-row:hover {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .rdg-row:nth-child(even) {
    background: #fafafa;
  }
  
  .rdg-cell {
    border-bottom: 1px solid #f1f5f9;
    box-sizing: border-box;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .rdg-cell:focus {
    outline: none;
    box-shadow: none;
  }
  
  .rdg-cell[aria-selected="true"] {
    background-color: transparent !important;
    box-shadow: none !important;
  }
  
  .rdg-cell[aria-colindex="1"] {
    justify-content: center;
  }
  
  .rdg-cell[aria-colindex="6"] {
    justify-content: flex-start;
    text-align: left;
  }
  
  .rdg-header-cell,
  .rdg-cell {
    min-width: 0;
  }
  
  .rdg {
    width: 100% !important;
  }
  
  .rdg-header-row,
  .rdg-row {
    width: 100% !important;
  }
  
  .rdg-header-cell,
  .rdg-cell {
    width: auto !important;
    min-width: 0;
  }
`;

const StyledDataGrid = styled(DataGrid)`
  height: calc(100vh - 300px) !important;
  border: none !important;
  flex: 1;
  width: 100%;
`;

// Reusable TableCell component
const TableCell = styled.span`
  color: ${props => props.color || '#1f2937'};
  font-weight: ${props => props.fontWeight || '400'};
  font-size: ${props => props.fontSize || '14px'};
  font-family: ${props => props.fontFamily || 'inherit'};
  text-align: ${props => props.textAlign || 'center'};
  text-decoration: ${props => props.textDecoration || 'none'};
  cursor: ${props => props.cursor || 'default'};
  transition: ${props => props.transition || 'color 0.3s ease'};
  display: ${props => props.display || 'inline'};
  ${props => props.webkitLineClamp && `
    display: -webkit-box;
    -webkit-line-clamp: ${props.webkitLineClamp};
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  &:hover {
    color: ${props => props.hoverColor || props.color};
    cursor: pointer;
  }
`;

// Styled components for Asset ID cell
const AssetIdCell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  background-color: transparent;
  outline: none;
  border: none;
`;

const AssetIdText = styled(TableCell)`
  color: #1e40af;
  font-weight: 600;
  font-size: 12px;
  font-family: monospace;
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.3s ease;

  ${AssetIdCell}:hover & {
    color: #10b981;
  }
`;


// Helper functions for asset styling
const getAssetColor = (type, isDarker = false) => {
  const colors = {
    'RF Clip': isDarker ? '#1e40af' : '#3b82f6',
    'RF Image': isDarker ? '#059669' : '#10b981',
    'iStock Subscription': isDarker ? '#dc2626' : '#ef4444',
    'Premium Access Time Limited': isDarker ? '#7c3aed' : '#8b5cf6',
    'Credit Pack': isDarker ? '#ea580c' : '#f97316',
    'default': isDarker ? '#6b7280' : '#9ca3af'
  };
  return colors[type] || colors.default;
};

const getAssetIcon = (contentType) => {
  if (contentType === 'VIDEO') return '🎥';
  if (contentType === 'PHOTO') return '📷';
  return '🖼️';
};

export default function StatisticPage() {
  const [pdfData, setPdfData] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);
  // const { toasts, success, error: showError, removeToast } = useToast();
  const { email, isAuthenticated } = useAuthRedux();
  const { showToast } = useStore();
  const [sortColumns, setSortColumns] = useState([]);
  const [loadingFromDb, setLoadingFromDb] = useState(false);
  const [dataSource, setDataSource] = useState(null); // 'file' or 'database'
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'upload'
  const [columnWidths, setColumnWidths] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    hasMore: false,
    currentPage: 1,
    totalPages: 1
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);

  // Function to load more data
  const loadMoreData = useCallback(() => {
    if (loadingMore || !pagination.hasMore) return;
    
    const loadData = async () => {
      setLoadingMore(true);
      setError("");
      
      try {
        const result = await getSalesData({
          limit: pagination.limit,
          includeStats: false // Don't fetch stats when loading more
        });
        
        if (result.success && result.data) {
          // Append new data (even if empty array)
          setParsedData(prev => [...prev, ...(result.data.sales || [])]);
          
          // Update pagination info
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }
          
          setDataSource('database');
          
          // Clear any previous errors if we got a successful response
          setError("");
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error loading more data:', err);
        
        // Check if it's an authentication error
        if (err.message.includes('401') || err.message.includes('Authentication')) {
          setError(`Authentication required: Please log in to view your data`);
          showToast({ type: 'error', message: `Authentication required: Please log in to view your data` });
        } else if (err.message.includes('500')) {
          // Don't show 500 errors for loading more data
          // Just stop loading more
          setError("");
        } else {
          setError(`Failed to load more data: ${err.message}`);
          showToast({ type: 'error', message: `Failed to load more data: ${err.message}` });
        }
      } finally {
        setLoadingMore(false);
      }
    };
    
    loadData();
  }, [loadingMore, pagination.hasMore, pagination.limit, parsedData.length, showToast]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      const { scrollTop, scrollHeight, clientHeight } = target;
      
      // Calculate distance from bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Trigger load more when user is within 200px from bottom
      if (distanceFromBottom < 200 && dataSource === 'database' && pagination.hasMore && !loadingMore) {
        loadMoreData();
      }
    };

    const container = scrollContainerRef.current;
    if (container && dataSource === 'database') {
      // Try multiple possible scroll elements
      const rdgViewport = container.querySelector('.rdg-viewport');
      const rdgElement = container.querySelector('.rdg');
      
      // Add listener to whichever element exists
      const scrollableElement = rdgViewport || rdgElement || container;
      
      scrollableElement.addEventListener('scroll', handleScroll);
      
      return () => {
        scrollableElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [dataSource, loadMoreData, pagination.hasMore, loadingMore]);

  // Load data from database on component mount and when switching to view tab
  useEffect(() => {
    if (activeTab === 'view') {
      // Reset and load first page when switching to view tab
      setParsedData([]);
      setPagination({
        total: 0,
        limit: 20,
        hasMore: false,
        currentPage: 1,
        totalPages: 1
      });
      loadDataFromDatabase(true);
    } else if (activeTab === 'upload') {
      // Reset upload tab data when switching to upload tab
      setParsedData([]);
      setStats(null);
      setDataSource(null);
      setError("");
      setPagination({
        total: 0,
        limit: 20,
        hasMore: false,
        currentPage: 1,
        totalPages: 1
      });
    }
  }, [activeTab]);


  // Define columns for DataGrid with fixed widths
  const columns = useMemo(() => [
    {
      key: 'assetId',
      name: 'Asset ID',
      width: columnWidths.assetId || '8%',
      minWidth: 100,
      renderCell: ({ row }) => (
        <AssetIdCell
          onClick={() => {
            const iStockUrl = `https://www.istockphoto.com/search/2/image-film?family=creative&phrase=${row.imageId}`;
            window.open(iStockUrl, '_blank', 'noopener,noreferrer');
            showToast({ type: 'success', message: `Opening iStock page for Asset ID ${row.imageId}` });
          }}
        >
          <AssetIdText>{row.imageId}</AssetIdText>
        </AssetIdCell>
      )
    },
    {
      key: 'id',
      name: 'ID',
      width: columnWidths.id || '6%',
      minWidth: 60,
      renderCell: ({ row }) => (
        <TableCell color="#1e40af" fontWeight="600" fontSize="14px">{row.id}</TableCell>
      )
    },
    {
      key: 'date',
      name: 'Date',
      width: columnWidths.date || '8%',
      minWidth: 80,
      renderCell: ({ row }) => (
        <TableCell color="#059669" fontSize="14px">{row.date}</TableCell>
      )
    },
    {
      key: 'type',
      name: 'Type',
      width: columnWidths.type || '10%',
      minWidth: 120,
      renderCell: ({ row }) => (
        <TableCell color="#dc2626" fontWeight="600" fontSize="14px">{row.type}</TableCell>
      )
    },
    {
      key: 'contentType',
      name: 'Content Type',
      width: columnWidths.contentType || '8%',
      minWidth: 100,
      renderCell: ({ row }) => (
        <TableCell color="#7c3aed" fontSize="14px">{row.contentType || 'N/A'}</TableCell>
      )
    },
    {
      key: 'description',
      name: 'Description',
      width: columnWidths.description || '20%',
      minWidth: 200,
      maxWidth: 500,
      renderCell: ({ row }) => (
        <TableCell 
          color="#1f2937" 
          fontSize="14px" 
          hoverColor="#1e40af"
          onClick={(e) => {
              e.preventDefault();
              const iStockUrl = `https://www.istockphoto.com/search/2/image-film?family=creative&phrase=${row.imageId}`;
              window.open(iStockUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          {row.description}
        </TableCell>
      )
    },
    {
      key: 'country',
      name: 'Country',
      width: columnWidths.country || '8%',
      minWidth: 80,
      renderCell: ({ row }) => (
        <TableCell color="#0891b2" fontSize="14px">{row.country}</TableCell>
      )
    },
    {
      key: 'platform',
      name: 'Platform',
      width: columnWidths.platform || '8%',
      minWidth: 100,
      renderCell: ({ row }) => (
        <TableCell color="#ea580c" fontWeight="600" fontSize="14px">{row.platform}</TableCell>
      )
    },
    {
      key: 'exclusivity',
      name: 'Exclusivity',
      width: columnWidths.exclusivity || '8%',
      minWidth: 100,
      renderCell: ({ row }) => (
        <TableCell 
          color={row.exclusivity === 'Exclusive' ? '#dc2626' : '#6b7280'}
          fontSize="14px"
        >
          {row.exclusivity || 'N/A'}
        </TableCell>
      )
    },
    {
      key: 'price',
      name: 'Price',
      width: columnWidths.price || '6%',
      minWidth: 60,
      renderCell: ({ row }) => (
        <TableCell color="#059669" fontWeight="600" fontSize="14px">${row.price}</TableCell>
      )
    },
    {
      key: 'earnings',
      name: 'Earnings',
      width: columnWidths.earnings || '8%',
      minWidth: 80,
      renderCell: ({ row }) => (
        <TableCell color="#16a34a" fontWeight="700" fontSize="14px">${row.earnings}</TableCell>
      )
    },
    {
      key: 'percentage',
      name: '%',
      width: columnWidths.percentage || '5%',
      minWidth: 50,
      renderCell: ({ row }) => (
        <TableCell color="#7c2d12" fontSize="14px">{row.percentage}%</TableCell>
      )
    },
    {
      key: 'agent',
      name: 'Agent',
      width: columnWidths.agent || '8%',
      minWidth: 80,
      renderCell: ({ row }) => (
        <TableCell color="#6b7280" fontSize="14px">{row.agent || 'N/A'}</TableCell>
      )
    }
  ], [columnWidths]);

  // Filter data based on search text
  const filteredData = useMemo(() => {
    if (!filterText) return parsedData;
    
    return parsedData.filter(item => 
      (item.description && item.description.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.country && item.country.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.platform && item.platform.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.id && item.id.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.type && item.type.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [parsedData, filterText]);

  // Sorting helpers
  const getCellValue = (row, key) => {
    const value = row[key];
    if (value === undefined || value === null) return '';
    // Numeric fields
    if (["price", "earnings", "percentage"].includes(key)) return Number(value) || 0;
    // Dates
    if (key === "date") return new Date(value).getTime() || 0;
    // Image ID numeric-like
    if (key === "imageId") return Number(value) || 0;
    return String(value).toLowerCase();
  };

  const compareBy = (key, direction) => (a, b) => {
    const va = getCellValue(a, key);
    const vb = getCellValue(b, key);
    if (va < vb) return direction === 'ASC' ? -1 : 1;
    if (va > vb) return direction === 'ASC' ? 1 : -1;
    return 0;
  };

  // Custom sort handler that defaults to DESC for price columns
  const handleSortColumnsChange = (newSortColumns) => {
    if (newSortColumns.length > 0) {
      const lastColumn = newSortColumns[newSortColumns.length - 1];
      // If it's a price-related column and direction is ASC, change to DESC
      if (['price', 'earnings', 'percentage'].includes(lastColumn.columnKey) && lastColumn.direction === 'ASC') {
        lastColumn.direction = 'DESC';
      }
    }
    setSortColumns(newSortColumns);
  };

  // Handle column resize
  const handleColumnResize = (columnKey, width) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: width
    }));
  };

  // Compute sorted rows
  const sortedRows = useMemo(() => {
    if (!sortColumns || sortColumns.length === 0) return filteredData;
    // Apply multi-column sorting in order
    let rows = [...filteredData];
    for (let i = sortColumns.length - 1; i >= 0; i -= 1) {
      const { columnKey, direction } = sortColumns[i];
      rows.sort(compareBy(columnKey, direction));
    }
    return rows;
  }, [filteredData, sortColumns]);

  // Calculate stats from sales data
  const calculateStatsFromSales = (sales) => {
    const totalEarnings = sales.reduce((sum, item) => sum + (item.earnings || 0), 0);
    const totalSales = sales.length;
    const countries = [...new Set(sales.map(item => item.country).filter(Boolean))];
    const platforms = [...new Set(sales.map(item => item.platform).filter(Boolean))];
    const productTypes = [...new Set(sales.map(item => item.type).filter(Boolean))];
    
    // Calculate average earnings per sale
    const avgEarnings = totalSales > 0 ? totalEarnings / totalSales : 0;
    
    // Find top earning sale
    const topSale = sales.reduce((max, item) => 
      (item.earnings > max.earnings) ? item : max, 
      { earnings: 0 }
    );
    
    return {
      totalEarnings: totalEarnings.toFixed(2),
      totalSales,
      avgEarnings: avgEarnings.toFixed(2),
      countries: countries.length,
      platforms: platforms.length,
      productTypes: productTypes.length,
      topEarning: topSale.earnings.toFixed(2),
      topSaleDescription: topSale.description || '',
      countryList: countries.join(', '),
      platformList: platforms.join(', '),
      productTypeList: productTypes.join(', ')
    };
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };



  const exportToCSV = () => {
    if (parsedData.length === 0) return;
    
    const headers = ['ID', 'Date', 'Type', 'Content Type', 'Description', 'Country', 'Platform', 'Exclusivity', 'Price', 'Earnings', 'Percentage', 'Agent', 'Credit Line', 'Notes', 'Image ID', 'Filename'];
    const csvContent = [
      headers.join(','),
      ...parsedData.map(item => [
        item.id,
        item.date,
        `"${item.type}"`,
        `"${item.contentType || ''}"`,
        `"${item.description}"`,
        `"${item.country}"`,
        `"${item.platform}"`,
        `"${item.exclusivity || ''}"`,
        item.price,
        item.earnings,
        item.percentage,
        `"${item.agent || ''}"`,
        `"${item.creditLine || ''}"`,
        `"${item.notes || ''}"`,
        item.imageId,
        `"${item.filename || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'istock_sales_data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const processTsvFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      setError('Please select a TSV or TXT file');
      showToast({ type: 'error', message: 'Unsupported file type. Please drop a .tsv or .txt file.' });
      return;
    }

    setLoading(true);
    setError("");
    setPdfData([]);
    setParsedData([]);

    try {
      const result = await parseTsvFile(file);
      
      if (result.success) {
        setParsedData(result.data.sales || []);
        setPdfData([]);
        const s = calculateStatsFromSales(result.data.sales || []);
        setStats(s);
        setDataSource('file');
        showToast({ type: 'success', message: `Imported ${(result.data.sales || []).length} rows` });
        
        // Clear any previous errors if upload was successful
        setError("");
      } else {
        throw new Error('Backend parsing failed');
      }
    } catch (err) {
      console.error('Error processing TSV file:', err);
      
      // Check if it's an authentication error
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        setError('Authentication required: Please log in to upload files');
        showToast({ type: 'error', message: 'Authentication required: Please log in to upload files' });
      } else {
        setError('Failed to parse TSV file: ' + err.message);
        showToast({ type: 'error', message: 'Failed to parse TSV file' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    await processTsvFile(file);
  };

  // Function to load data from Firebase database with pagination
  const loadDataFromDatabase = async (resetData = false) => {
    setLoadingFromDb(true);
    setError("");
    
    try {
      const result = await getSalesData({
        limit: pagination.limit,
        includeStats: true // Fetch stats on first load
      });
      
      if (result.success && result.data) {
        // Set data (even if empty array)
        setParsedData(result.data.sales || []);
        
        // Update stats (can be null if no data)
        if (result.data.stats) {
          setStats(result.data.stats);
        } else {
          setStats(null);
        }
        
        // Update pagination info
        if (result.data.pagination) {
          setPagination(result.data.pagination);
        }
        
        setDataSource('database');
        
        // Clear any previous errors if we got a successful response (even with empty data)
        setError("");
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error loading data from database:', err);
      
      // Check if it's an authentication error
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        setError(`Authentication required: Please log in to view your data`);
        showToast({ type: 'error', message: `Authentication required: Please log in to view your data` });
      } else if (err.message.includes('500')) {
        // Don't show 500 errors as they might be expected (no data, etc.)
        // Just set empty data and let the "No data" screen show
        setParsedData([]);
        setStats(null);
        setDataSource('database');
        setError(""); // Clear any previous errors
      } else {
        setError(`Failed to load data from database: ${err.message}`);
        showToast({ type: 'error', message: `Failed to load data from database: ${err.message}` });
      }
    } finally {
      setLoadingFromDb(false);
    }
  };



  return (
    <Container>
      <Header>
        <div>
          <Title>iStock Sales Statistics</Title>
          {activeTab === 'view' && (
            <div style={{ 
              fontSize: '14px', 
              color: '#059669',
              marginTop: '4px',
              fontWeight: '500'
            }}>
              📊 Data from: Firebase Database {isAuthenticated && email && `(${email})`}
            </div>
          )}
          {activeTab === 'upload' && (
            <div style={{ 
              fontSize: '14px', 
              color: '#3b82f6',
              marginTop: '4px',
              fontWeight: '500'
            }}>
              📊 Data from: TSV File {isAuthenticated && email && `(${email})`}
            </div>
          )}
        </div>
          {parsedData.length > 0 && !loading && !loadingFromDb && dataSource === 'database' && (
            <FilterContainer>
              <FilterInput
                type="text"
                placeholder="Filter by description, country, platform..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <ExportButton onClick={exportToCSV}>
                Export to CSV
              </ExportButton>
            </FilterContainer>
          )}
        <TabContainer>
          <TabButton 
            active={activeTab === 'view'} 
            onClick={() => setActiveTab('view')}
          >
            <TabText>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <span>View Database</span>
              </span>
            </TabText>
          </TabButton>
          <TabButton 
            active={activeTab === 'upload'} 
            onClick={() => activeTab === 'view' ? setActiveTab('upload') : parsedData.length === 0 ? setActiveTab('upload') : handleFileSelect()}
          >
            <TabText>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>📁</span>
                <span>{activeTab === 'view' ? 'Upload TSV' : parsedData.length === 0 ? 'Upload TSV' : 'Reupload TSV'}</span>
              </span>
            </TabText>
          </TabButton>
        </TabContainer>
      </Header>

      <FileInput
        ref={fileInputRef}
        type="file"
        accept=".tsv,.txt"
        onChange={handleFileChange}
      />

      <ContentArea>
        {loading && (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingTitle>Processing TSV File</LoadingTitle>
            <LoadingSubtitle>Parsing data and saving to database...</LoadingSubtitle>
          </LoadingContainer>
        )}
        {loadingFromDb && (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingTitle>Loading Database</LoadingTitle>
            <LoadingSubtitle>Fetching latest data from database...</LoadingSubtitle>
          </LoadingContainer>
        )}
        {error && isAuthenticated && !error.includes('Authentication') && !error.includes('500') && parsedData.length > 0 && <ErrorText>{error}</ErrorText>}

        {/* View Tab - Database Data */}
        <TabContent active={activeTab === 'view'}>
          {parsedData.length > 0 && !loading && !loadingFromDb && dataSource === 'database' && (
          <>
            <StatsContainer>
              {(() => {
                // Prefer backend-provided stats snapshot when viewing database
                const s = stats || null;
                let items = [];
                if (s) {
                  const avg = s.totalSales ? (s.totalEarnings / s.totalSales) : 0;
                  const platforms = s.byPlatform ? Object.keys(s.byPlatform).length : 0;
                  items = [
                    { label: 'Total Earnings', value: `$${Number(s.totalEarnings || 0).toFixed(2)}` },
                    { label: 'Total Sales', value: Number(s.totalSales || 0) },
                    { label: 'Avg per Sale', value: `$${avg.toFixed(2)}` },
                    { label: 'Platforms', value: platforms }
                  ];
                } else {
                  // Fallback to client-side calculation if stats are missing
                  const cs = calculateStatsFromSales(parsedData);
                  items = [
                    { label: 'Total Earnings', value: `$${cs.totalEarnings}` },
                    { label: 'Total Sales', value: cs.totalSales },
                    { label: 'Avg per Sale', value: `$${cs.avgEarnings}` },
                    { label: 'Countries', value: cs.countries },
                    { label: 'Platforms', value: cs.platforms },
                    { label: 'Product Types', value: cs.productTypes },
                    { label: 'Top Sale', value: `$${cs.topEarning}` }
                  ];
                }
                return (
                  <>
                    {items.map((it) => (
                      <StatCard key={it.label}>
                        <StatValue>{it.value}</StatValue>
                        <StatLabel>{it.label}</StatLabel>
                    </StatCard>
                    ))}
                  </>
                );
              })()}
            </StatsContainer>
            
            <DataGridContainer ref={scrollContainerRef}>
              <StyledDataGrid
                columns={columns}
                rows={sortedRows}
                rowHeight={60}
                headerRowHeight={44}
                enableColumnResizing={true}
                defaultColumnOptions={{
                  sortable: true,
                  resizable: true
                }}
                sortColumns={sortColumns}
                onSortColumnsChange={handleSortColumnsChange}
                onColumnResize={handleColumnResize}
                style={{ width: '100%' }}
              />
            </DataGridContainer>
            
              {/* Pagination info */}
              {parsedData.length > 0 && !error && (
                <PaginationInfo>
                  {pagination.hasMore ? (
                    <>
                      Showing{' '}
                      {loadingMore ? (
                        <InlineLoader />
                      ) : (
                        <strong>{parsedData.length}</strong>
                      )}{' '}
                      of <strong>{pagination.total}</strong> rows
                      <div style={{ width: '140px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                        {loadingMore ? 'Loading more rows...' : 'Scroll down to load more'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>📊</div>
                      All <strong>{pagination.total}</strong> rows loaded
                    </>
                  )}
                </PaginationInfo>
              )}
          </>
          )}
          
          {!isAuthenticated && (
            <DropZoneView>
              <DropZoneContent>
                <DropZoneEmoji 
                  animation="pulse"
                  filter="drop-shadow(0 4px 8px rgba(239, 68, 68, 0.2))"
                >
                  🔒
                </DropZoneEmoji>
                <DropZoneHeading color="#dc2626">
                  Authentication Required
                </DropZoneHeading>
                <DropZoneSubtitle>
                  Please log in to view your personal statistics
                </DropZoneSubtitle>
                <DropZoneHint 
                  color="#dc2626" 
                  background="rgba(239, 68, 68, 0.1)"
                >
                  🔑 Each user sees only their own data
                </DropZoneHint>
              </DropZoneContent>
            </DropZoneView>
          )}
          
          {isAuthenticated && parsedData.length === 0 && !loading && !loadingFromDb && (
            <DropZoneView>
              <DropZoneContent>
                <DropZoneEmoji 
                  animation="pulse"
                  filter="drop-shadow(0 4px 8px rgba(14, 165, 233, 0.2))"
                >
                  📊
                </DropZoneEmoji>
                <DropZoneHeading color="#0369a1">
                  No data in your database
                </DropZoneHeading>
                <DropZoneSubtitle>
                  Upload TSV files to populate your personal database
                </DropZoneSubtitle>
                <DropZoneHint 
                  color="#0ea5e9" 
                  background="rgba(14, 165, 233, 0.1)"
                >
                  💡 Switch to Upload tab to get started
                </DropZoneHint>
              </DropZoneContent>
            </DropZoneView>
          )}
        </TabContent>

        {/* Upload Tab - TSV Upload */}
        <TabContent active={activeTab === 'upload'}>
          {parsedData.length > 0 && !loading && !error && dataSource === 'file' && (
            <>
              <StatsContainer>
                {(() => {
                  const s = calculateStatsFromSales(parsedData);
                  const items = [
                    { label: 'Total Earnings', value: `$${s.totalEarnings}` },
                    { label: 'Total Sales', value: s.totalSales },
                    { label: 'Avg per Sale', value: `$${s.avgEarnings}` },
                    { label: 'Countries', value: s.countries },
                    { label: 'Platforms', value: s.platforms },
                    { label: 'Product Types', value: s.productTypes },
                    { label: 'Top Sale', value: `$${s.topEarning}` }
                  ];
                  return (
                    <>
                      {items.map((it) => (
                        <StatCard key={it.label}>
                          <StatValue>{it.value}</StatValue>
                          <StatLabel>{it.label}</StatLabel>
                        </StatCard>
                      ))}
                    </>
                  );
                })()}
              </StatsContainer>
              
              <FilterContainer>
                <FilterInput
                  type="text"
                  placeholder="Filter by description, country, platform..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
                <ExportButton onClick={exportToCSV}>
                  Export to CSV
                </ExportButton>
              </FilterContainer>
              
              <DataGridContainer>
                <StyledDataGrid
                  columns={columns}
                  rows={sortedRows}
                  rowHeight={60}
                  headerRowHeight={44}
                  enableColumnResizing={true}
                  defaultColumnOptions={{
                    sortable: true,
                    resizable: true
                  }}
                  sortColumns={sortColumns}
                  onSortColumnsChange={handleSortColumnsChange}
                  onColumnResize={handleColumnResize}
                  style={{ width: '100%' }}
                />
              </DataGridContainer>
            </>
          )}
          
          {!isAuthenticated && (
            <DropZoneUpload>
              <DropZoneContent>
                <DropZoneEmoji>🔒</DropZoneEmoji>
                <DropZoneHeading color="#dc2626">Authentication Required</DropZoneHeading>
                <DropZoneSubtitle>Please log in to upload TSV files</DropZoneSubtitle>
                <DropZoneHint color="#dc2626" background="rgba(239, 68, 68, 0.1)">
                  🔑 Upload data will be saved to your personal account
                </DropZoneHint>
              </DropZoneContent>
            </DropZoneUpload>
          )}
          
          {isAuthenticated && parsedData.length === 0 && !loading && !error && (
            <DropZoneUpload
              onDragOver={(e)=> { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e)=> { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer?.files?.length) processTsvFile(e.dataTransfer.files[0]); }}
            >
              <DropZoneContent>
                <DropZoneEmoji>📁</DropZoneEmoji>
                <DropZoneHeading>Drag & drop TSV file here</DropZoneHeading>
                <DropZoneSubtitle>or click "Select TSV File" button</DropZoneSubtitle>
                <DropZoneHint>
                  ✨ Data will be automatically saved to your personal database
                </DropZoneHint>
              </DropZoneContent>
            </DropZoneUpload>
          )}
        </TabContent>
      </ContentArea>
      
      {/* Toast notifications */}
      {/* <ToastComponent toasts={toasts} onRemove={removeToast} /> */}
    </Container>
  );
}


