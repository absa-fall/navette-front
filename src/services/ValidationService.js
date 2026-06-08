import api from '../api/axios'

const validationService = {
    // Valider la montee (scan QR ou code)
    validerMontee: async (qrCode, latitude = null, longitude = null) => {
        const res = await api.post('/validation/montee', {
            qr_code: qrCode,
            latitude,
            longitude,
        })
        return res.data
    },

    // Valider la descente
    validerDescente: async (qrCode, latitude = null, longitude = null) => {
        const res = await api.post('/validation/descente', {
            qr_code: qrCode,
            latitude,
            longitude,
        })
        return res.data
    },

    // Verifier le statut d'un QR code
    verifierQR: async (qrCode) => {
        const res = await api.get(`/validation/verifier/${qrCode}`)
        return res.data
    },

    // Recuperer mon QR code (pour le passager connecte)
    monQRCode: async () => {
        const res = await api.get('/mon-qr-code')
        return res.data
    },
}

export default validationService