const Reporte = (req, res, next) => {
    const url = req.url;
    const query = req.query;
    console.log(`Ruta: ${url} \nQuery: `, query);
    next()

}
module.exports = {Reporte};