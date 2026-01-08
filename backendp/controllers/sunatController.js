// controllers/sunatController.js
const consultarRUC = async (req, res) => {
    try {
        const { numero_ruc } = req.body;
        
        // Validar RUC
        if (!numero_ruc || numero_ruc.length !== 11) {
            return res.status(400).json({ error: 'El RUC debe tener 11 dígitos' });
        }

        // Configurar token de DECOLECTA desde variables de entorno
        const token = process.env.DECOLECTA_TOKEN;
        
        if (!token) {
            return res.status(500).json({ error: 'Token de API no configurado' });
        }

        // Realizar consulta a DECOLECTA con fetch nativo
        const response = await fetch(`https://api.decolecta.com/v1/sunat/ruc/full?numero=${numero_ruc}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.status(401).json({ error: 'Token de API inválido o sin créditos' });
            }
            if (response.status === 404) {
                return res.status(404).json({ error: 'RUC no encontrado' });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Error en consulta RUC:', error.message);
        res.status(500).json({ error: 'Error al consultar el RUC' });
    }
};

const consultarDNI = async (req, res) => {
    try {
        const { numero_dni } = req.body;
        
        // Validar DNI
        if (!numero_dni || numero_dni.length !== 8) {
            return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
        }

        // Configurar token de DECOLECTA desde variables de entorno
        const token = process.env.DECOLECTA_TOKEN;
        
        if (!token) {
            return res.status(500).json({ error: 'Token de API no configurado' });
        }

        // Realizar consulta a DECOLECTA con fetch nativo
        const response = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${numero_dni}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.status(401).json({ error: 'Token de API inválido o sin créditos' });
            }
            if (response.status === 404) {
                return res.status(404).json({ error: 'DNI no encontrado' });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Error en consulta DNI:', error.message);
        res.status(500).json({ error: 'Error al consultar el DNI' });
    }
};

module.exports = {
    consultarRUC,
    consultarDNI
};