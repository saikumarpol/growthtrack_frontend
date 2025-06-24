import React from 'react'
import { Link } from 'react-router-dom'

const PageNotFound = () => {

    const errorPageStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
    };

    const titleStyle = {
        fontSize: '3rem',
        marginBottom: '10px',
    };

    const descriptionStyle = {
        fontSize: '1.5rem',
        marginBottom: '10px',
    };

    const buttonStyle = {
        marginTop: '10px',
        padding: '10px 20px',
        backgroundColor: '#000080',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        fontWeight: 'bold',
    };


    return (
        <>

            <div style={errorPageStyle}>
                <div>
                    <h1 style={titleStyle}>404</h1>
                    <h2 style={descriptionStyle}>Oops! Page not found.</h2>
                    <p>
                        The page you are looking for might have been removed or doesn't exist.
                    </p>
                    <Link to="/" style={buttonStyle}>
                        Go to Home
                    </Link>
                </div>
            </div>
            <br></br>
            <br></br>

        </>
    )
}

export default PageNotFound
