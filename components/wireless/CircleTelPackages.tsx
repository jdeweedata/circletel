import React, { useState } from 'react';
import './PricingPackages.css'; // Use the CSS file created above

interface Package {
  id: string;
  speed: string;
  price: number;
  type: 'uncapped' | 'capped' | 'premium';
  label: string;
  isInCart?: boolean;
}

const CircleTelPackages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'capped' | 'uncapped'>('uncapped');
  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      speed: '20Mbps',
      price: 299,
      type: 'uncapped',
      label: 'Uncapped anytime',
      isInCart: false,
    },
    {
      id: '2',
      speed: '50Mbps',
      price: 399,
      type: 'uncapped',
      label: 'Uncapped anytime',
      isInCart: true,
    },
    {
      id: '3',
      speed: '100Mbps',
      price: 599,
      type: 'uncapped',
      label: 'Uncapped anytime',
      isInCart: false,
    },
    {
      id: '4',
      speed: 'Premium',
      price: 949,
      type: 'premium',
      label: 'Uncapped anytime',
      isInCart: false,
    },
  ]);

  const filteredPackages = packages.filter(pkg => {
    if (activeTab === 'all') return true;
    if (activeTab === 'capped') return pkg.type === 'capped';
    if (activeTab === 'uncapped') return pkg.type === 'uncapped' || pkg.type === 'premium';
    return true;
  });

  const handleAddToCart = (packageId: string) => {
    setPackages(prevPackages =>
      prevPackages.map(pkg =>
        pkg.id === packageId ? { ...pkg, isInCart: !pkg.isInCart } : pkg
      )
    );
  };

  return (
    <div className="pricing-container">
      <header className="pricing-header">
        <h1>All CircleTel Wireless packages.</h1>
        <p className="subtitle">Choose the perfect wireless package for your needs</p>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === 'capped' ? 'active' : ''}`}
            onClick={() => setActiveTab('capped')}
          >
            Capped
          </button>
          <button
            className={`tab ${activeTab === 'uncapped' ? 'active' : ''}`}
            onClick={() => setActiveTab('uncapped')}
          >
            Uncapped
          </button>
        </div>
      </header>

      {/* Packages Grid - This fixes the white space issue */}
      <div className="packages-grid">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            className={`package-card ${pkg.type === 'premium' ? 'premium' : ''}`}
          >
            <div className="package-content">
              <h3 className="package-speed">{pkg.speed}</h3>
              <p className="package-label">{pkg.label}</p>
              
              <div className="price-section">
                <span className="currency">R</span>
                <span className="price">{pkg.price}</span>
                <span className="period">.00 /pm</span>
              </div>
              
              <button
                className={`cta-button ${pkg.isInCart ? 'in-cart' : 'add-to-cart'}`}
                onClick={() => handleAddToCart(pkg.id)}
              >
                {pkg.isInCart ? '✓ In Cart' : '🛒 Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits Section */}
      <aside className="benefits-section">
        <h2>CircleTel wireless</h2>
        <div className="benefit-item">
          <span className="icon">⭐</span>
          <div>
            <h3>Save R1 000 on hardware.</h3>
            <p>With selected SIM + Device orders.</p>
          </div>
        </div>
        <div className="benefit-item">
          <span className="icon">📡</span>
          <div>
            <h3>FREE router.</h3>
            <p>With CircleTel Wireless Plus.</p>
          </div>
        </div>
        <div className="benefit-item">
          <span className="icon">📦</span>
          <div>
            <h3>FREE delivery.</h3>
            <p>With any SIM and/or device order.</p>
          </div>
        </div>
        <div className="benefit-item">
          <span className="icon">⚙️</span>
          <div>
            <h3>No setup required.</h3>
            <p>Insert your SIM and you're good to go.</p>
          </div>
        </div>
        <div className="benefit-item">
          <span className="icon">⏰</span>
          <div>
            <h3>Uncapped thresholds and throttling.</h3>
            <p>See T&Cs for a detailed breakdown.</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CircleTelPackages;
