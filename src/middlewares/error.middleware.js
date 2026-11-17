/* 
function errorMiddleware(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode >= 500
                ? "Internal server error"
                : err.message
    });
}

module.exports = errorMiddleware;
 */

function errorMiddleware(err, req, res, next) {
    console.error("========== ERROR ==========");
    console.error("Message:", err.message);
    console.error("Name:", err.name);
    console.error("Stack:", err.stack);
    console.error("===========================");

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode >= 500
                ? "Internal server error"
                : err.message
    });
}

module.exports = errorMiddleware;