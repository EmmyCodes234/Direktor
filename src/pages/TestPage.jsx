import React from 'react';

const TestPage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(45deg, #ff0000, #00ff00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
        }}>
            🚨 TEST PAGE WORKING! 🚨
            <br />
            If you see this, the dev environment is working!
        </div>
    );
};

export default TestPage;
