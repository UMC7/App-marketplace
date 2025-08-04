import React, { useEffect, useState, useCallback } from 'react';
import ProductList from '../components/ProductList';
import './HomePage.css';
import supabase from '../supabase';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCondition, setSelectedCondition] = useState('');
  const [countriesWithProducts, setCountriesWithProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      setProducts(data || []);
      setFilteredProducts(data || []);
      setLoading(false);

      const countries = [...new Set(data.map((product) => product.country))];
      setCountriesWithProducts(countries);
    } catch (error) {
      console.error('Failed to load products:', error.message);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('module', 'market');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error.message);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = [...products];
  
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => String(product.category_id) === String(selectedCategory)
      );
    }
  
    if (selectedCountry) {
      filtered = filtered.filter((product) => product.country === selectedCountry);
    }
  
    if (selectedCity) {
      filtered = filtered.filter((product) =>
        product.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }
  
    if (priceRange.min !== '' || priceRange.max !== '') {
      filtered = filtered.filter((product) => {
        const price = product.price;
        const minPriceValid = priceRange.min === '' || price >= priceRange.min;
        const maxPriceValid = priceRange.max === '' || price <= priceRange.max;
        return minPriceValid && maxPriceValid;
      });
    }
  
    if (selectedCondition) {
      filtered = filtered.filter((product) => product.condition === selectedCondition);
    }
  
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  
    // 🔽 Lógica de ordenamiento por precio
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }
  
    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedCountry, selectedCity, priceRange, selectedCondition, searchTerm, sortOrder]);  

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  return (
  <div className="container">
    <div className="module-header-wrapper">
    <div className="module-header-row">
    <h1>SeaMarket</h1>
    <span>Explore Available Products</span>
  </div>
</div>

<h3
  className="filter-toggle"
  onClick={() => setShowFilters((prev) => !prev)}
>
  {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
</h3>

    <button
      className="navbar-toggle"
      onClick={() => setShowFilters((prev) => !prev)}
      style={{
        marginBottom: '10px',
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
      }}
    >
      ☰ Filters
    </button>

    {showFilters && (
      <div className="filter-body expanded">
        <div className="filters-container filters-panel show">
          {/* 🔍 Búsqueda */}
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

<select
  className="category-select"
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
>
  <option value="">Filter by category</option>
  {[...categories]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
  ))}
</select>

<select
  className="category-select"
  value={selectedCondition}
  onChange={(e) => setSelectedCondition(e.target.value)}
>
  <option value="">Filter by condition</option>
  {['New', 'Second-hand', 'Refurbished'].map((condition) => (
    <option key={condition} value={condition}>
      {condition}
    </option>
  ))}
</select>

<select
  className="category-select"
  value={selectedCountry}
  onChange={(e) => setSelectedCountry(e.target.value)}
>
  <option value="">Filter by country</option>
  {countriesWithProducts.map((country) => (
    <option key={country} value={country}>
      {country}
    </option>
  ))}
</select>

<input
  type="text"
  className="search-input"
  placeholder="Filter by city"
  value={selectedCity}
  onChange={(e) => setSelectedCity(e.target.value)}
/>

<div className="price-group-container">
  <input
    type="number"
    className="price-input small-input"
    placeholder="Minimum price"
    value={priceRange.min}
    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
  />

  <input
    type="number"
    className="price-input small-input"
    placeholder="Maximum price"
    value={priceRange.max}
    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
  />
</div>

<select
  className="category-select"
  value={sortOrder}
  onChange={(e) => setSortOrder(e.target.value)}
>
  <option value="">Sort by price</option>
  <option value="asc">Price: low to high</option>
  <option value="desc">Price: high to low</option>
</select>
        </div>
      </div>
    )}

    {loading ? (
      <p>Loading products...</p>
    ) : (
      <ProductList products={filteredProducts} />
    )}
  </div>
);  
}

export default HomePage;