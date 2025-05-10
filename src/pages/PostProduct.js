import React from 'react';
import { useLocation } from 'react-router-dom';
import PostServiceForm from '../components/PostServiceForm';
import PostProductForm from '../components/PostProductForm';

function PostProduct() {
  const location = useLocation();
  const isYachtServices = location.pathname.includes('/yacht-services');

  return (
    <div>
      {isYachtServices ? <PostServiceForm /> : <PostProductForm />}
    </div>
  );
}

export default PostProduct;