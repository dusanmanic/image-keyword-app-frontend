import React, { useState, useRef } from "react";
import styled from "styled-components";
import { parseTsvFile } from "../services/tsvService.js";

const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  padding: 20px;
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
  background: white;
  border-radius: 12px;
  padding: 20px;
  min-height: 400px;
  border: 1px solid #e5e7eb;
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 16px;
  text-align: center;
  padding: 40px;
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 16px;
  text-align: center;
  padding: 40px;
`;

const PdfText = styled.div`
  color: #1f2937;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  max-width: 100%;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
  display: block;
`;

const TableHeader = styled.thead`
  background: #f8fafc;
  display: block;
  width: 100%;
`;

const TableHeaderCell = styled.th`
  padding: 12px 8px;
  text-align: left;
  font-weight: 700;
  color: #1e40af;
  border-bottom: 2px solid #3b82f6;
  font-size: 12px;
  white-space: nowrap;
  min-width: 80px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableBody = styled.tbody`
  display: block;
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
`;

const TableRow = styled.tr`
  display: table;
  width: 100%;
  table-layout: fixed;
  transition: all 0.2s ease;
  &:hover {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  &:nth-child(even) {
    background: #fafafa;
  }
`;

const TableCell = styled.td`
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
  font-size: 12px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
  font-weight: 500;
`;

const PageNumber = styled.div`
  background: #eff6ff;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  display: inline-block;
  min-width: 40px;
  text-align: center;
`;

const PageText = styled.div`
  color: #1f2937;
  font-size: 14px;
  line-height: 1.5;
  max-width: 500px;
`;

const PageImage = styled.img`
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: contain;
`;

const NoContent = styled.div`
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 20px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

export default function StatisticPage() {
  const [pdfData, setPdfData] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      setError('Please select a TSV or TXT file');
      return;
    }

    setLoading(true);
    setError("");
    setPdfData([]);
    setParsedData([]);

    try {
      const result = await parseTsvFile(file);
      
      if (result.success) {
        // TSV parser returns sales data and stats
        setParsedData(result.data.sales);
        setPdfData([]); // No pages for TSV
        
        // Calculate stats from sales data
        const stats = calculateStatsFromSales(result.data.sales);
        setStats(stats);
      } else {
        throw new Error('Backend parsing failed');
      }
    } catch (err) {
      setError('Failed to parse TSV file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>iStock Sales Statistics</Title>
        <Button onClick={handleFileSelect}>
          Select TSV File
        </Button>
      </Header>

      <FileInput
        ref={fileInputRef}
        type="file"
        accept=".tsv,.txt"
        onChange={handleFileChange}
      />

      <ContentArea>
        {loading && <LoadingText>Parsing TSV file...</LoadingText>}
        {error && <ErrorText>{error}</ErrorText>}
        
        {parsedData.length > 0 && !loading && !error && (
          <>
            <StatsContainer>
              {(() => {
                const stats = calculateStatsFromSales(parsedData);
                return (
                  <>
                    <StatCard>
                      <StatValue>${stats.totalEarnings}</StatValue>
                      <StatLabel>Total Earnings</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{stats.totalSales}</StatValue>
                      <StatLabel>Total Sales</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>${stats.avgEarnings}</StatValue>
                      <StatLabel>Avg per Sale</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{stats.countries}</StatValue>
                      <StatLabel>Countries</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{stats.platforms}</StatValue>
                      <StatLabel>Platforms</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{stats.productTypes}</StatValue>
                      <StatLabel>Product Types</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>${stats.topEarning}</StatValue>
                      <StatLabel>Top Sale</StatLabel>
                    </StatCard>
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
            
            <TableContainer>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Image</TableHeaderCell>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Content Type</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Country</TableHeaderCell>
                    <TableHeaderCell>Platform</TableHeaderCell>
                    <TableHeaderCell>Exclusivity</TableHeaderCell>
                    <TableHeaderCell>Price</TableHeaderCell>
                    <TableHeaderCell>Earnings</TableHeaderCell>
                    <TableHeaderCell>%</TableHeaderCell>
                    <TableHeaderCell>Agent</TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {parsedData
                    .filter(item => 
                      !filterText || 
                      (item.description && item.description.toLowerCase().includes(filterText.toLowerCase())) ||
                      (item.country && item.country.toLowerCase().includes(filterText.toLowerCase())) ||
                      (item.platform && item.platform.toLowerCase().includes(filterText.toLowerCase())) ||
                      (item.id && item.id.toLowerCase().includes(filterText.toLowerCase())) ||
                      (item.type && item.type.toLowerCase().includes(filterText.toLowerCase()))
                    )
                    .map((item, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ maxWidth: '80px', padding: '4px' }}>
                        <PageImage 
                          src={item.imageUrl} 
                          alt={item.description}
                          style={{ maxWidth: '60px', maxHeight: '40px', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </TableCell>
                      <TableCell style={{ color: '#1e40af', fontWeight: '600' }}>{item.id}</TableCell>
                      <TableCell style={{ color: '#059669' }}>{item.date}</TableCell>
                      <TableCell style={{ color: '#dc2626', fontWeight: '600' }}>{item.type}</TableCell>
                      <TableCell style={{ color: '#7c3aed' }}>{item.contentType || 'N/A'}</TableCell>
                      <TableCell style={{ maxWidth: '200px', whiteSpace: 'normal', color: '#1f2937' }}>
                          {item.description}
                      </TableCell>
                      <TableCell style={{ color: '#0891b2' }}>{item.country}</TableCell>
                      <TableCell style={{ color: '#ea580c', fontWeight: '600' }}>{item.platform}</TableCell>
                      <TableCell style={{ color: item.exclusivity === 'Exclusive' ? '#dc2626' : '#6b7280' }}>
                        {item.exclusivity || 'N/A'}
                      </TableCell>
                      <TableCell style={{ color: '#059669', fontWeight: '600' }}>${item.price}</TableCell>
                      <TableCell style={{ color: '#16a34a', fontWeight: '700' }}>${item.earnings}</TableCell>
                      <TableCell style={{ color: '#7c2d12' }}>{item.percentage}%</TableCell>
                      <TableCell style={{ color: '#6b7280' }}>{item.agent || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        
        
        {parsedData.length === 0 && !loading && !error && (
          <LoadingText>Select a TSV file to view sales data</LoadingText>
        )}
      </ContentArea>
    </Container>
  );
}


