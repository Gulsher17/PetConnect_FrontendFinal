import React, { useState } from 'react';
import { 
  FaLink, FaCube, FaInfoCircle, FaCogs, FaPaw, FaStar,
  FaSatelliteDish, FaFileContract, FaSearch, FaDog, FaHistory,
  FaFeatherAlt, FaBookOpen, FaCheckCircle, FaHeart,
  FaEthereum, FaDatabase, FaShieldAlt, FaProjectDiagram
} from 'react-icons/fa';
import { SiEthereum } from 'react-icons/si';
import { http } from '@/lib/http';
import './BlockchainDemo.css';

interface BlockchainResult {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  target: string;
  timestamp: Date;
}

interface ContractTest {
  owner?: string;
  totalAdoptions?: number;
  success?: boolean;
  error?: string;
}

interface BlockchainStatus {
  isConnected: boolean;
  contract: boolean;
  hasGas: boolean;
  contractAddress?: string;
  contractTest?: ContractTest;
  env: {
    CONTRACT_ADDRESS: string;
    INFURA_PROJECT_ID: string;
    WALLET_PRIVATE_KEY: string;
  };
}

const BlockchainDemo: React.FC = () => {
  const [statusResults, setStatusResults] = useState<BlockchainResult[]>([]);
  const [adoptionResults, setAdoptionResults] = useState<BlockchainResult[]>([]);
  const [liveStatus, setLiveStatus] = useState('Click "Test Blockchain Status" to check');
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', target: 'status' | 'adoption' = 'status') => {
    const newResult: BlockchainResult = {
      id: Date.now().toString(),
      message,
      type,
      target,
      timestamp: new Date()
    };

    if (target === 'status') {
      setStatusResults(prev => [newResult, ...prev].slice(0, 10));
    } else {
      setAdoptionResults(prev => [newResult, ...prev].slice(0, 10));
    }
  };

  const testBlockchainStatus = async () => {
    try {
      setIsLoading(true);
      addResult('Testing real blockchain network status...', 'info');
      
      // Use http client instead of fetch
      const response = await http.get('/blockchain/public-status');
      const data = response.data;
      
      if (data.success) {
        const status: BlockchainStatus = data.status;
        setLiveStatus(`Connected to ${status.contractAddress ? 'Sepolia Testnet' : 'Unknown Network'}`);
        
        let statusMessage = `
Blockchain Status:
✓ Network: Sepolia Testnet
✓ Connection: ${status.isConnected ? 'Connected' : 'Disconnected'}
✓ Contract: ${status.contract ? 'Loaded' : 'Not Loaded'}
✓ Gas Available: ${status.hasGas ? 'Yes' : 'No'}
✓ Contract Address: ${status.contractAddress || 'Not set'}
        `.trim();

        if (status.contractTest) {
          statusMessage += `\n\nContract Test Results:
✓ Owner: ${status.contractTest.owner || 'N/A'}
✓ Total Adoptions: ${status.contractTest.totalAdoptions || '0'}
✓ Success: ${status.contractTest.success ? 'Yes' : 'No'}`;
          
          if (status.contractTest.error) {
            statusMessage += `\n Error: ${status.contractTest.error}`;
          }
        }

        statusMessage += `\n\nEnvironment Check:
✓ CONTRACT_ADDRESS: ${status.env.CONTRACT_ADDRESS}
✓ INFURA_PROJECT_ID: ${status.env.INFURA_PROJECT_ID}
✓ WALLET_PRIVATE_KEY: ${status.env.WALLET_PRIVATE_KEY}`;

        addResult(statusMessage, data.success ? 'success' : 'error');
      } else {
        addResult(`Failed to get blockchain status: ${data.error}`, 'error');
      }
      
    } catch (error: any) {
      addResult(`Network error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testContractConnection = async () => {
    try {
      setIsLoading(true);
      addResult('Testing real smart contract connection...', 'info');
      
      // Use http client instead of fetch
      const response = await http.post('/blockchain/public-test-contract');
      const data = response.data;
      
      if (data.success) {
        let contractMessage = `
Smart Contract Connection Test:
✓ Blockchain Connected: ${data.status.isConnected ? 'Yes' : 'No'}
✓ Contract Loaded: ${data.status.contract ? 'Yes' : 'No'}
✓ Gas Available: ${data.status.hasGas ? 'Yes' : 'No'}
✓ Real Mode: ${data.realMode ? 'LIVE BLOCKCHAIN' : 'SIMULATION MODE'}
        `.trim();

        if (data.contractTest) {
          contractMessage += `\n\nContract Read Test:
✓ Owner: ${data.contractTest.owner || 'N/A'}
✓ Total Adoptions: ${data.contractTest.totalAdoptions || '0'}
✓ Success: ${data.contractTest.success ? 'Yes' : 'No'}`;
          
          if (data.contractTest.error) {
            contractMessage += `\n Read Error: ${data.contractTest.error}`;
          }
        }

        addResult(contractMessage, data.success ? 'success' : 'warning');
      } else {
        addResult(`Contract test failed: ${data.error}`, 'error');
      }
      
    } catch (error: any) {
      addResult(`Network error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testAdoptionRecording = async () => {
    try {
      setIsLoading(true);
      addResult('Recording REAL adoption on blockchain...', 'info', 'adoption');
      
      const testData = {
        petId: 'demo_pet_' + Date.now(),
        petName: 'Blockchain Demo Pet',
        breed: 'Siberian Husky'
      };
      
      addResult(`Sending test data: ${JSON.stringify(testData)}`, 'info', 'adoption');
      
      const response = await http.post('/blockchain/test-adoption', testData);
      const data = response.data;
      
      if (data.success) {
        const result = data.result;
        
        let adoptionMessage = `
  Adoption Recording Test:
  ✓ Success: ${result.success ? 'Yes' : 'No'}
  ✓ Mode: ${result.simulated ? 'SIMULATION' : 'REAL BLOCKCHAIN'}
  ✓ Message: ${result.message}
        `.trim();
  
        if (result.transactionHash) {
          adoptionMessage += `\n\n Transaction Details:
  ✓ Transaction Hash: ${result.transactionHash}
  ✓ Block Number: ${result.blockNumber || 'Pending'}
  ✓ Gas Used: ${result.gasUsed || 'N/A'}
  ✓ Contract Address: 0xD39f2A5E56a9B8B12066aC47DA86B4F27478aDEA`;
  
          if (result.transactionHash && !result.simulated) {
            adoptionMessage += ` View on Explorer: https://sepolia.etherscan.io/tx/${result.transactionHash}`;
            adoptionMessage += `\n Contract: https://sepolia.etherscan.io/address/0xD39f2A5E56a9B8B12066aC47DA86B4F27478aDEA`;
          }
        }
  
        if (result.error) {
          adoptionMessage += `\n\nError: ${result.error}`;
        }
  
        addResult(adoptionMessage, result.success ? 'success' : 'warning', 'adoption');
      } else {
        const errorMessage = data.error || data.message || 'Unknown error occurred';
        addResult(`Adoption recording failed: ${errorMessage}`, 'error', 'adoption');
      }
      
    } catch (error: any) {
      console.error('Adoption recording error:', error);
      if (error.response?.status === 401) {
        addResult('Authentication failed. Please log in again.', 'error', 'adoption');
      } else {
        addResult(`Error: ${error.message}`, 'error', 'adoption');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const viewAdoptionHistory = async () => {
    try {
      setIsLoading(true);
      addResult('Retrieving adoption history from blockchain...', 'info', 'adoption');
      
      // Use http client instead of fetch
      const response = await http.get('/blockchain/public-status');
      const statusData = response.data;
      
      let historyMessage = `Current Blockchain Status:\n`;
      historyMessage += `✓ Network: Sepolia Testnet\n`;
      historyMessage += `✓ Contract: ${statusData.status.contractAddress || 'Not set'}\n`;
      
      if (statusData.status.contractTest) {
        historyMessage += `✓ Total Adoptions on Contract: ${statusData.status.contractTest.totalAdoptions || '0'}\n`;
        historyMessage += `✓ Contract Owner: ${statusData.status.contractTest.owner || 'N/A'}\n`;
      }
      
      historyMessage += `\nNote: To view specific adoption history, use the main application interface.`;
      
      addResult(historyMessage, 'info', 'adoption');
      
    } catch (error: any) {
      addResult(`Failed to retrieve history: ${error.message}`, 'error', 'adoption');
    } finally {
      setIsLoading(false);
    }
  };

  const showContractDetails = async () => {
    try {
      setIsLoading(true);
      addResult('Fetching contract details...', 'info');
      
      // Use http client instead of fetch
      const response = await http.get('/blockchain/public-status');
      const data = response.data;
      
      if (data.success && data.status.contractAddress) {
        const contractMessage = `
Smart Contract Details:
✓ Address: ${data.status.contractAddress}
✓ Network: Sepolia Testnet
✓ Owner: ${data.status.contractTest?.owner || 'Loading...'}
✓ Total Adoptions: ${data.status.contractTest?.totalAdoptions || '0'}

🔗 Explorer Links:
• Contract: https://sepolia.etherscan.io/address/${data.status.contractAddress}
• Recent Transactions: https://sepolia.etherscan.io/address/${data.status.contractAddress}#transactions
        `.trim();
        
        addResult(contractMessage, 'success');
      } else {
        addResult('Contract details not available', 'warning');
      }
    } catch (error: any) {
      addResult(`Error fetching contract details: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="blockchain-demo">
      <header className="demo-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <FaLink className="logo-icon" />
              <div>
                <h1>Blockchain Adoption System</h1>
                <p className="tagline">Secure, Transparent & Immutable Pet Adoption Records</p>
              </div>
            </div>
            <div className="blockchain-animation">
              <div className="block"><FaCube /></div>
              <div className="chain"></div>
              <div className="block"><FaCube /></div>
              <div className="chain"></div>
              <div className="block"><FaCube /></div>
              <div className="chain"></div>
              <div className="block"><FaCube /></div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container">
        {/* System Overview Section */}
        <section className="demo-section">
          <div className="section-title">
            <FaInfoCircle />
            <h2>System Overview</h2>
          </div>
          <p>This demonstration showcases a blockchain-based pet adoption system that permanently records adoption transactions on a distributed ledger. Each adoption creates an immutable record that cannot be altered or deleted.</p>
          
          <div className="blockchain-visual">
            <h3><FaProjectDiagram /> Real Blockchain Network</h3>
            <p>This demo connects to the <strong>Sepolia Testnet</strong> using your deployed smart contract:</p>
            <p><strong>Contract Address:</strong>0xD39f2A5E56a9B8B12066aC47DA86B4F27478aDEA</p>
            <p><strong>Network:</strong> Ethereum Sepolia Testnet</p>
            <p><strong>Status:</strong> <span id="live-status">{liveStatus}</span></p>
            
            <div className="blockchain-animation">
              <div className="block"><SiEthereum /></div>
              <div className="chain"></div>
              <div className="block"><FaLink /></div>
              <div className="chain"></div>
              <div className="block"><FaDatabase /></div>
              <div className="chain"></div>
              <div className="block"><FaShieldAlt /></div>
            </div>
          </div>
        </section>
        
        {/* Blockchain Status Section */}
        <section className="demo-section">
          <div className="section-title">
            <FaCogs />
            <h2>Blockchain Status & Configuration</h2>
          </div>
          <p>Check the current status of the blockchain network and verify that all systems are operational.</p>
          
          <div className="test-buttons">
            <button 
              className={`btn ${isLoading ? 'loading' : ''}`} 
              onClick={testBlockchainStatus}
              disabled={isLoading}
            >
              <FaSatelliteDish /> Test Blockchain Status
            </button>
            <button 
              className={`btn btn-warning ${isLoading ? 'loading' : ''}`} 
              onClick={testContractConnection}
              disabled={isLoading}
            >
              <FaFileContract /> Test Contract Connection
            </button>
            <button 
              className={`btn btn-success ${isLoading ? 'loading' : ''}`} 
              onClick={showContractDetails}
              disabled={isLoading}
            >
              <FaSearch /> View Contract Details
            </button>
          </div>
          
          <div className="results-container">
            {statusResults.map(result => (
              <div key={result.id} className={`result ${result.type}`}>
                <strong>{result.type.toUpperCase()}:</strong> {result.message}
              </div>
            ))}
          </div>
        </section>
        
        {/* Adoption Testing Section */}
        <section className="demo-section">
          <div className="section-title">
            <FaPaw />
            <h2>Adoption Transaction Testing</h2>
          </div>
          <p>Simulate recording a pet adoption on the blockchain. This creates a permanent, tamper-proof record of the adoption.</p>
          
          <div className="card-grid">
            <div className="card">
              <h3><FaDog /> Test Adoption</h3>
              <p>Record a sample pet adoption to demonstrate the blockchain functionality.</p>
              <button 
                className={`btn btn-success btn-block ${isLoading ? 'loading' : ''}`} 
                onClick={testAdoptionRecording}
                disabled={isLoading}
              >
                <FaFeatherAlt /> Test Adoption Recording
              </button>
            </div>
            
            <div className="card">
              <h3><FaHistory /> View Adoption History</h3>
              <p>Retrieve and display previous adoption records stored on the blockchain.</p>
              <button 
                className={`btn btn-block ${isLoading ? 'loading' : ''}`} 
                onClick={viewAdoptionHistory}
                disabled={isLoading}
              >
                <FaBookOpen /> View History
              </button>
            </div>
          </div>
          
          <div className="results-container">
            {adoptionResults.map(result => (
              <div key={result.id} className={`result ${result.type}`}>
                <strong>{result.type.toUpperCase()}:</strong> {result.message}
              </div>
            ))}
          </div>
        </section>
        
        {/* Features Section */}
        <section className="demo-section">
          <div className="section-title">
            <FaStar />
            <h2>Key Features</h2>
          </div>
          
          <ul className="feature-list">
            <li><FaCheckCircle /> <strong>Immutable Records:</strong> Once recorded, adoption data cannot be altered or deleted</li>
            <li><FaCheckCircle /> <strong>Transparency:</strong> All transactions are visible to authorized parties</li>
            <li><FaCheckCircle /> <strong>Security:</strong> Cryptographic encryption ensures data integrity</li>
            <li><FaCheckCircle /> <strong>Decentralization:</strong> No single point of failure</li>
            <li><FaCheckCircle /> <strong>Automation:</strong> Smart contracts execute automatically when conditions are met</li>
          </ul>
        </section>
      </div>
      
      <footer>
        <div className="container">
          <p>Blockchain Adoption System Demo &copy; 2024 | Built with <FaHeart style={{color: '#e74c3c'}} /> for Secure Pet Adoptions</p>
        </div>
      </footer>
    </div>
  );
};

export default BlockchainDemo;