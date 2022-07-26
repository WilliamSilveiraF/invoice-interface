import { createContext, useState, useEffect }  from 'react'
import jwt_decode from 'jwt-decode'
import { axiosAPI } from '../utils'
import { useNavigate } from 'react-router-dom'
import { validateData } from '../validators'

const AuthContext = createContext()


export default AuthContext

export const AuthProvider = ({children}) => {
    const initToken = () => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null

    const navigate = useNavigate()

    let [loginErrors, setLoginErrors] = useState([])
    let [user, setUser] = useState(initToken)
    let [authTokens, setAuthTokens] = useState(initToken)
    let [loading, setLoading] = useState(true)
    
    useEffect(() => {
        if (loading && authTokens) {
            updateToken()
        } else {
            setLoading(false)
        }

        let fiveMinutes = 1000 * 60 * 5
        let interval = setInterval(() => {
            if (authTokens) {
                updateToken()
            }
        }, fiveMinutes)

        return () => clearInterval(interval)
    }, [authTokens, loading])

    const loginUser = async (userData) => {
        const errors = validateData(['username', 'password'], userData)
        if (errors.length) {
            return setLoginErrors(errors)
        }

        axiosAPI.post('auth/token/', userData)
            .then(res => {
                setAuthTokens(res.data)
                setUser(jwt_decode(res.data.access))
                localStorage.setItem('authTokens', JSON.stringify(res.data))
                navigate('/')
            })
            .catch(_ => console.error("Login failed"))
    }

    const logoutUser = () => {
        setAuthTokens(null)
        setUser(null)
        localStorage.removeItem('authTokens')
        navigate('/login')
    }

    const updateToken = async () => {
        console.log("REFRESH")
        axiosAPI.post('auth/token/refresh/', {"refresh": authTokens?.refresh})
            .then(res => {
                setAuthTokens(res.data)
                setUser(jwt_decode(res.data.access))
                localStorage.setItem('authTokens', JSON.stringify(res.data))
            })
            .catch(err => {
                console.error("Update token failed", err)
                logoutUser()
            })

            if (loading) {
                setLoading(false)
            }
    }

    let context = {
        user: user,
        loginUser: loginUser,
        logoutUser: logoutUser,
        loginErrors: loginErrors
    }

    return <AuthContext.Provider value={context}>
        {loading ? null : children}
    </AuthContext.Provider>
}