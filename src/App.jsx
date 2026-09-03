import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './closed-status.css'
import { AuthProvider, useAuth } from './lib/auth'
import LoadingScreen from './components/LoadingScreen'
import StudentLaunchGate from './components/StudentLaunchGate'
import PRControlHub from './components/admin/PRControlHub'
import RollerFeedPinnedPodium from './components/RollerFeedPinnedPodium'
import AmigosPRProfilePortal from './components/profile/AmigosPRProfilePortal'

import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import MusicPage from './pages/Music'
import PRCardPage from './pages/PRCard'
import ActivityPage from './pages/Activity'
import MyActivity from './pages/MyActivity'
import ServicesPage from './pages/Services'
import ContentPage from './pages/Content'
import StorePage from './pages/Store'
import Admin from './pages/Admin'
import Alianza from './pages/Alianza'
import Cuponeras from './pages/Cuponeras'
import Personalizadas from './pages/Personalizadas'
import AdminPersonalizadasBulk from './pages/AdminPersonalizadasBulk'
import PasaporteKids from './pages/PasaporteKids'
import Uniformes from './pages/Uniformes'
import Tracking from './pages/Tracking'
import Terminos from './pages/Terminos'
import StravaCallback from './pages/StravaCallback'
import CommunityPage from './pages/Community'
import MessagesPage from './pages/Messages'
import PublicRollerFeed from './pages/PublicRollerFeed'
import PublicWeeklyRanking from './pages/PublicWeeklyRanking'
import MiEvolucion from './pages/MiEvolucion'
import AvatarPremiumPreview from './pages/AvatarPremiumPreview'
import Insignias from './pages/Insignias'
import Inscripciones2026 from './pages/Inscripciones2026'
import AdminInscripciones2026 from './pages/AdminInscripciones2026'
import PRKidsInscripciones2026 from './pages/PRKidsInscripciones2026'
import ClinicaMiguelSept2026 from './pages/ClinicaMiguelSept2026'
import ClinicaMiguelOct2026 from './pages/ClinicaMiguelOct2026'
import PRMoments from './pages/PRMoments'
import WelcomeAccess from './pages/WelcomeAccess'
import AdminAccessRequests from './pages/AdminAccessRequests'

function ScrollToTop(){const{pathname}=useLocation();useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0},[pathname]);return null}
function PrivateRoute({children}){const{user,loading}=useAuth();const location=useLocation();if(loading)return null;if(!user)return <Navigate to="/login" state={{from:location}} replace/>;return <StudentLaunchGate user={user}>{children}</StudentLaunchGate>}
function AdminRoute({children}){const{user,loading}=useAuth();const location=useLocation();if(loading)return null;if(!user)return <Navigate to="/login" state={{from:location}} replace/>;if(!['admin','profesor'].includes(user.role))return <Navigate to="/app/perfil" replace/>;return <StudentLaunchGate user={user}>{children}</StudentLaunchGate>}
function FullAdminRoute({children}){const{user,loading}=useAuth();const location=useLocation();if(loading)return null;if(!user)return <Navigate to="/login" state={{from:location}} replace/>;if(user.role!=='admin')return <Navigate to="/admin" replace/>;return <StudentLaunchGate user={user}>{children}</StudentLaunchGate>}
function AdminProfileShortcut(){return <a href="/app/perfil" className="fixed bottom-[88px] left-5 z-[230] flex min-h-12 items-center gap-2 rounded-2xl border border-pr-gold/25 bg-[#15130d]/95 px-4 py-3 text-xs font-black text-pr-gold shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl active:scale-[.98]" aria-label="Volver a mi perfil"><span className="text-base">👤</span><span>Mi perfil</span></a>}
function ActivityWithPinnedPodium(){return <><RollerFeedPinnedPodium/><ActivityPage/></>}
function ProfileWithAmigosPR(){return <><Profile/><AmigosPRProfilePortal/></>}
function AppRoutes(){return <><ScrollToTop/><Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/rollerfeed" element={<PublicRollerFeed/>}/><Route path="/ranking-semanal" element={<PublicWeeklyRanking/>}/><Route path="/inscripciones-2026" element={<Inscripciones2026/>}/><Route path="/inscripciones-kids-2026" element={<PRKidsInscripciones2026/>}/><Route path="/clinica-miguel-septiembre" element={<ClinicaMiguelSept2026/>}/><Route path="/clinica-miguel-octubre" element={<ClinicaMiguelOct2026/>}/><Route path="/personalizadas" element={<Personalizadas/>}/><Route path="/bienvenido" element={<WelcomeAccess/>}/><Route path="/soy-nuevo" element={<Navigate to="/bienvenido" replace/>}/><Route path="/alianza" element={<Alianza/>}/><Route path="/cuponeras" element={<Cuponeras/>}/><Route path="/pasaporte-kids" element={<PasaporteKids/>}/><Route path="/uniformes" element={<Uniformes/>}/><Route path="/tracking" element={<Tracking/>}/><Route path="/terminos" element={<Terminos/>}/><Route path="/app/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/><Route path="/app/perfil" element={<PrivateRoute><ProfileWithAmigosPR/></PrivateRoute>}/><Route path="/app/avatar" element={<PrivateRoute><Navigate to="/app/avatar-premium" replace/></PrivateRoute>}/><Route path="/app/avatar-premium" element={<PrivateRoute><AvatarPremiumPreview/></PrivateRoute>}/><Route path="/app/evolucion" element={<PrivateRoute><MiEvolucion/></PrivateRoute>}/><Route path="/app/entrenamiento" element={<PrivateRoute><MyActivity/></PrivateRoute>}/><Route path="/app/insignias" element={<PrivateRoute><Insignias/></PrivateRoute>}/><Route path="/app/musica" element={<PrivateRoute><MusicPage/></PrivateRoute>}/><Route path="/app/strava/callback" element={<PrivateRoute><StravaCallback/></PrivateRoute>}/><Route path="/app/prcard" element={<PrivateRoute><PRCardPage/></PrivateRoute>}/><Route path="/app/tracking" element={<PrivateRoute><Tracking/></PrivateRoute>}/><Route path="/app/moments" element={<PrivateRoute><PRMoments/></PrivateRoute>}/><Route path="/app/actividad" element={<PrivateRoute><ActivityWithPinnedPodium/></PrivateRoute>}/><Route path="/app/servicios" element={<PrivateRoute><ServicesPage/></PrivateRoute>}/><Route path="/app/contenido" element={<PrivateRoute><ContentPage/></PrivateRoute>}/><Route path="/app/tienda" element={<PrivateRoute><StorePage/></PrivateRoute>}/><Route path="/app/comunidad" element={<PrivateRoute><CommunityPage/></PrivateRoute>}/><Route path="/app/mensajes" element={<PrivateRoute><MessagesPage/></PrivateRoute>}/><Route path="/admin" element={<AdminRoute><><Admin/><PRControlHub/><AdminProfileShortcut/></></AdminRoute>}/><Route path="/admin/inscripciones-2026" element={<FullAdminRoute><AdminInscripciones2026/></FullAdminRoute>}/><Route path="/admin/personalizadas" element={<FullAdminRoute><AdminPersonalizadasBulk/></FullAdminRoute>}/><Route path="/admin/nuevos-accesos" element={<FullAdminRoute><AdminAccessRequests/></FullAdminRoute>}/><Route path="/app" element={<Navigate to="/app/perfil" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></>}
export default function App(){const[loaded,setLoaded]=useState(false);return <AuthProvider>{!loaded&&<LoadingScreen onDone={()=>setLoaded(true)}/>}<div className={`transition-opacity duration-500 ${loaded?'opacity-100':'opacity-0 pointer-events-none'}`}><AppRoutes/></div></AuthProvider>}
