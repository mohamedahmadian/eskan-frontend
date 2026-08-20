import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './auth/AuthProvider'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { languages, type AppLanguage } from './i18n'
import { CaravanCreatePage } from './pages/caravans/CaravanCreatePage'
import { CaravanDetailPage } from './pages/caravans/CaravanDetailPage'
import { CaravanEditPage } from './pages/caravans/CaravanEditPage'
import { CaravansListPage } from './pages/caravans/CaravansListPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { CitiesListPage } from './pages/geo/CitiesListPage'
import { CityCreatePage } from './pages/geo/CityCreatePage'
import { CityDetailPage } from './pages/geo/CityDetailPage'
import { CityEditPage } from './pages/geo/CityEditPage'
import { CountriesListPage } from './pages/geo/CountriesListPage'
import { CountryCreatePage } from './pages/geo/CountryCreatePage'
import { CountryDetailPage } from './pages/geo/CountryDetailPage'
import { CountryEditPage } from './pages/geo/CountryEditPage'
import { ProvinceCreatePage } from './pages/geo/ProvinceCreatePage'
import { ProvinceDetailPage } from './pages/geo/ProvinceDetailPage'
import { ProvinceEditPage } from './pages/geo/ProvinceEditPage'
import { ProvincesListPage } from './pages/geo/ProvincesListPage'
import { FoodSupplierCreatePage } from './pages/food-suppliers/FoodSupplierCreatePage'
import { FoodSupplierDetailPage } from './pages/food-suppliers/FoodSupplierDetailPage'
import { FoodSupplierEditPage } from './pages/food-suppliers/FoodSupplierEditPage'
import { FoodSuppliersListPage } from './pages/food-suppliers/FoodSuppliersListPage'
import { MedicalCenterCreatePage } from './pages/medical-centers/MedicalCenterCreatePage'
import { MedicalCenterDetailPage } from './pages/medical-centers/MedicalCenterDetailPage'
import { MedicalCenterEditPage } from './pages/medical-centers/MedicalCenterEditPage'
import { MedicalCentersListPage } from './pages/medical-centers/MedicalCentersListPage'
import { BenefactorCreatePage } from './pages/benefactors/BenefactorCreatePage'
import { BenefactorDetailPage } from './pages/benefactors/BenefactorDetailPage'
import { BenefactorEditPage } from './pages/benefactors/BenefactorEditPage'
import { BenefactorsListPage } from './pages/benefactors/BenefactorsListPage'
import { RedCrescentCreatePage } from './pages/red-crescents/RedCrescentCreatePage'
import { RedCrescentDetailPage } from './pages/red-crescents/RedCrescentDetailPage'
import { RedCrescentEditPage } from './pages/red-crescents/RedCrescentEditPage'
import { RedCrescentsListPage } from './pages/red-crescents/RedCrescentsListPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { PilgrimCreatePage } from './pages/pilgrims/PilgrimCreatePage'
import { PilgrimDetailPage } from './pages/pilgrims/PilgrimDetailPage'
import { PilgrimEditPage } from './pages/pilgrims/PilgrimEditPage'
import { PilgrimsListPage } from './pages/pilgrims/PilgrimsListPage'
import { SettingsPage } from './pages/SettingsPage'
import { SmsReportPage } from './pages/sms/SmsReportPage'
import { SmsSendPage } from './pages/sms/SmsSendPage'
import { SmsSettingsPage } from './pages/sms/SmsSettingsPage'
import { UserCreatePage } from './pages/users/UserCreatePage'
import { UserDetailPage } from './pages/users/UserDetailPage'
import { UserEditPage } from './pages/users/UserEditPage'
import { UsersListPage } from './pages/users/UsersListPage'
import { AccommodationCreatePage } from './pages/accommodations/AccommodationCreatePage'
import { AccommodationDetailPage } from './pages/accommodations/AccommodationDetailPage'
import { AccommodationEditPage } from './pages/accommodations/AccommodationEditPage'
import { AccommodationReportPage } from './pages/accommodations/AccommodationReportPage'
import { AccommodationsListPage } from './pages/accommodations/AccommodationsListPage'
import { AccommodationManagerCreatePage } from './pages/accommodation-managers/AccommodationManagerCreatePage'
import { AccommodationManagerDetailPage } from './pages/accommodation-managers/AccommodationManagerDetailPage'
import { AccommodationManagerEditPage } from './pages/accommodation-managers/AccommodationManagerEditPage'
import { AccommodationManagersListPage } from './pages/accommodation-managers/AccommodationManagersListPage'
import { CaravanManagerCreatePage } from './pages/caravan-managers/CaravanManagerCreatePage'
import { CaravanManagerDetailPage } from './pages/caravan-managers/CaravanManagerDetailPage'
import { CaravanManagerEditPage } from './pages/caravan-managers/CaravanManagerEditPage'
import { CaravanManagersListPage } from './pages/caravan-managers/CaravanManagersListPage'
import { HeadquartersRepresentativeCreatePage } from './pages/headquarters-representatives/HeadquartersRepresentativeCreatePage'
import { HeadquartersRepresentativeDetailPage } from './pages/headquarters-representatives/HeadquartersRepresentativeDetailPage'
import { HeadquartersRepresentativeEditPage } from './pages/headquarters-representatives/HeadquartersRepresentativeEditPage'
import { HeadquartersRepresentativesListPage } from './pages/headquarters-representatives/HeadquartersRepresentativesListPage'
import { WalkingRouteCreatePage } from './pages/walking-routes/WalkingRouteCreatePage'
import { WalkingRouteDetailPage } from './pages/walking-routes/WalkingRouteDetailPage'
import { WalkingRouteEditPage } from './pages/walking-routes/WalkingRouteEditPage'
import { WalkingRoutesListPage } from './pages/walking-routes/WalkingRoutesListPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RequireMenuAccess } from './routes/RequireMenuAccess'

const queryClient = new QueryClient()

function AppToaster() {
  const { i18n } = useTranslation()
  const lang = (i18n.language.split('-')[0] as AppLanguage) || 'fa'
  return (
    <Toaster richColors position="top-center" dir={languages[lang]?.dir ?? 'rtl'} />
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/password" element={<ChangePasswordPage />} />
                <Route element={<RequireMenuAccess path="/pilgrims" />}>
                  <Route path="/pilgrims" element={<PilgrimsListPage />} />
                  <Route path="/pilgrims/new" element={<PilgrimCreatePage />} />
                  <Route path="/pilgrims/:id" element={<PilgrimDetailPage />} />
                  <Route path="/pilgrims/:id/edit" element={<PilgrimEditPage />} />
                </Route>
                <Route path="/caravans" element={<CaravansListPage />} />
                <Route path="/caravans/new" element={<CaravanCreatePage />} />
                <Route path="/caravans/:id" element={<CaravanDetailPage />} />
                <Route path="/caravans/:id/edit" element={<CaravanEditPage />} />
                <Route element={<RequireMenuAccess path="/base-info/countries" />}>
                  <Route path="/base-info/countries" element={<CountriesListPage />} />
                  <Route path="/base-info/countries/new" element={<CountryCreatePage />} />
                  <Route path="/base-info/countries/:id" element={<CountryDetailPage />} />
                  <Route path="/base-info/countries/:id/edit" element={<CountryEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/provinces" />}>
                  <Route path="/base-info/provinces" element={<ProvincesListPage />} />
                  <Route path="/base-info/provinces/new" element={<ProvinceCreatePage />} />
                  <Route path="/base-info/provinces/:id" element={<ProvinceDetailPage />} />
                  <Route path="/base-info/provinces/:id/edit" element={<ProvinceEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/cities" />}>
                  <Route path="/base-info/cities" element={<CitiesListPage />} />
                  <Route path="/base-info/cities/new" element={<CityCreatePage />} />
                  <Route path="/base-info/cities/:id" element={<CityDetailPage />} />
                  <Route path="/base-info/cities/:id/edit" element={<CityEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/walking-routes" />}>
                  <Route path="/base-info/walking-routes" element={<WalkingRoutesListPage />} />
                  <Route path="/base-info/walking-routes/new" element={<WalkingRouteCreatePage />} />
                  <Route path="/base-info/walking-routes/:id" element={<WalkingRouteDetailPage />} />
                  <Route path="/base-info/walking-routes/:id/edit" element={<WalkingRouteEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/food-suppliers" />}>
                  <Route path="/base-info/food-suppliers" element={<FoodSuppliersListPage />} />
                  <Route path="/base-info/food-suppliers/new" element={<FoodSupplierCreatePage />} />
                  <Route path="/base-info/food-suppliers/:id" element={<FoodSupplierDetailPage />} />
                  <Route path="/base-info/food-suppliers/:id/edit" element={<FoodSupplierEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/medical-centers" />}>
                  <Route path="/base-info/medical-centers" element={<MedicalCentersListPage />} />
                  <Route path="/base-info/medical-centers/new" element={<MedicalCenterCreatePage />} />
                  <Route path="/base-info/medical-centers/:id" element={<MedicalCenterDetailPage />} />
                  <Route path="/base-info/medical-centers/:id/edit" element={<MedicalCenterEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/red-crescents" />}>
                  <Route path="/base-info/red-crescents" element={<RedCrescentsListPage />} />
                  <Route path="/base-info/red-crescents/new" element={<RedCrescentCreatePage />} />
                  <Route path="/base-info/red-crescents/:id" element={<RedCrescentDetailPage />} />
                  <Route path="/base-info/red-crescents/:id/edit" element={<RedCrescentEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/benefactors" />}>
                  <Route path="/base-info/benefactors" element={<BenefactorsListPage />} />
                  <Route path="/base-info/benefactors/new" element={<BenefactorCreatePage />} />
                  <Route path="/base-info/benefactors/:id" element={<BenefactorDetailPage />} />
                  <Route path="/base-info/benefactors/:id/edit" element={<BenefactorEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/sms/settings" />}>
                  <Route path="/sms/settings" element={<SmsSettingsPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/sms/send" />}>
                  <Route path="/sms/send" element={<SmsSendPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/sms/report" />}>
                  <Route path="/sms/report" element={<SmsReportPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/users" />}>
                  <Route path="/users" element={<UsersListPage />} />
                  <Route path="/users/new" element={<UserCreatePage />} />
                  <Route path="/users/:id" element={<UserDetailPage />} />
                  <Route path="/users/:id/edit" element={<UserEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/caravan-managers" />}>
                  <Route path="/caravan-managers" element={<CaravanManagersListPage />} />
                  <Route path="/caravan-managers/new" element={<CaravanManagerCreatePage />} />
                  <Route path="/caravan-managers/:id" element={<CaravanManagerDetailPage />} />
                  <Route path="/caravan-managers/:id/edit" element={<CaravanManagerEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/accommodation-managers" />}>
                  <Route path="/accommodation-managers" element={<AccommodationManagersListPage />} />
                  <Route path="/accommodation-managers/new" element={<AccommodationManagerCreatePage />} />
                  <Route path="/accommodation-managers/:id" element={<AccommodationManagerDetailPage />} />
                  <Route path="/accommodation-managers/:id/edit" element={<AccommodationManagerEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/headquarters/representatives" />}>
                  <Route path="/headquarters/representatives" element={<HeadquartersRepresentativesListPage />} />
                  <Route path="/headquarters/representatives/new" element={<HeadquartersRepresentativeCreatePage />} />
                  <Route path="/headquarters/representatives/:id" element={<HeadquartersRepresentativeDetailPage />} />
                  <Route path="/headquarters/representatives/:id/edit" element={<HeadquartersRepresentativeEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/accommodations" />}>
                  <Route path="/accommodations" element={<AccommodationsListPage />} />
                  <Route path="/accommodations/new" element={<AccommodationCreatePage />} />
                  <Route path="/accommodations/:id" element={<AccommodationDetailPage />} />
                  <Route path="/accommodations/:id/edit" element={<AccommodationEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/accommodation-report" />}>
                  <Route path="/accommodation-report" element={<AccommodationReportPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
