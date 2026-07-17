import { useState, useEffect, useRef } from 'react'
import Layout, { getRoleLabel } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Camera, Lock, Trash2, Mail, Building2, Hash } from 'lucide-react'

export default function Parametres() {
    const { user } = useAuth()
    const fileInputRef = useRef(null)

    const [avatar, setAvatar] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadMsg, setUploadMsg] = useState('')

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    })
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordMsg, setPasswordMsg] = useState('')
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await api.get('/profile/me')
                if (res.data.avatar) setAvatar(res.data.avatar)
            } catch {}
        }
        fetchMe()
    }, [])

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        setUploadMsg('')

        try {
            const formData = new FormData()
            formData.append('avatar', file)
            const res = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setAvatar(res.data.avatar)
            setUploadMsg('Photo mise à jour !')
        } catch {
            setUploadMsg("Erreur lors de l'upload.")
        } finally {
            setUploading(false)
        }
    }

    const supprimerAvatar = async () => {
        if (!window.confirm('Supprimer votre photo de profil ?')) return

        try {
            await api.delete('/profile/avatar')
            setAvatar(null)
            setUploadMsg('Photo supprimée avec succès')
            setTimeout(() => setUploadMsg(''), 3000)
        } catch {
            setUploadMsg('Erreur lors de la suppression')
            setTimeout(() => setUploadMsg(''), 3000)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPasswordLoading(true)
        setPasswordMsg('')
        setPasswordError('')

        try {
            const res = await api.put('/profile/password', passwordForm)
            setPasswordMsg(res.data.message || 'Mot de passe modifié avec succès')
            setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Erreur lors du changement de mot de passe')
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <Layout title="Paramètres" subtitle="Gérez votre profil et votre sécurité">
            <div className="space-y-6 max-w-4xl">

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez votre profil et votre sécurité</p>
                </div>

                {/* Carte profil */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-8 flex flex-col items-center gap-4">
                        <div className="relative group">
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt="avatar"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 shadow-lg">
                                    {user?.prenom?.[0]}{user?.nom?.[0]}
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
                            >
                                <Camera size={20} className="text-white" />
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-white text-lg font-semibold">{user?.prenom} {user?.nom}</p>
                            <p className="text-blue-200 text-sm mt-0.5">{getRoleLabel(user)}</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">

                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <Camera size={16} className="text-blue-600" />
                                {uploading ? 'Envoi en cours...' : 'Changer la photo'}
                            </button>

                            {avatar && (
                                <button
                                    onClick={supprimerAvatar}
                                    className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                                >
                                    <Trash2 size={16} />
                                    Supprimer la photo
                                </button>
                            )}
                        </div>

                        {uploadMsg && (
                            <p className={`text-sm px-3 py-2 rounded-xl ${uploadMsg.includes('Erreur') ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                {uploadMsg}
                            </p>
                        )}

                        <div className="border-t border-gray-100 pt-5 space-y-3">
                            {user?.email && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail size={16} className="text-gray-400" />
                                    {user.email}
                                </div>
                            )}
                            {user?.ufr && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Building2 size={16} className="text-gray-400" />
                                    {user.ufr}
                                </div>
                            )}
                            {user?.matricule && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Hash size={16} className="text-gray-400" />
                                    Mat. {user.matricule}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Carte sécurité */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                            <Lock size={18} className="text-blue-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Changer le mot de passe</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">

                        {passwordMsg && (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                                {passwordMsg}
                            </div>
                        )}
                        {passwordError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                                {passwordError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe actuel</label>
                            <input
                                type="password"
                                required
                                value={passwordForm.current_password}
                                onChange={e => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passwordForm.new_password}
                                onChange={e => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le nouveau mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passwordForm.new_password_confirmation}
                                onChange={e => setPasswordForm(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                            {passwordLoading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : 'Modifier le mot de passe'}
                        </button>
                    </form>
                </div>

            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
            />
        </Layout>
    )
}