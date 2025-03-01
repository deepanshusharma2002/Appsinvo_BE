const handleError = (err, req, res, next) => {
    console.error('Error occurred:', err.message);
    return res.status(500).json({
        status_code: 500,
        message: "Internal Server Error",
        data: null
    });

}

module.exports = handleError