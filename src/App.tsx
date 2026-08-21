import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './auth/AuthProvider'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { useSelectNumberOnFocus } from './hooks/useSelectNumberOnFocus'
import { languages, type AppLanguage } from './i18n'
import { CaravanCreatePage } from './pages/caravans/CaravanCreatePage'
import { CaravanDetailPage } from './pages/caravans/CaravanDetailPage'
import { CaravanEditPage } from './pages/caravans/CaravanEditPage'
import { CaravanPilgrimageHistoryPage } from './pages/caravans/CaravanPilgrimageHistoryPage'
import { CaravansListPage } from './pages/caravans/CaravansListPage'
import { MyCaravanCreatePage } from './pages/caravans/MyCaravanCreatePage'
import { MyCaravansListPage } from './pages/caravans/MyCaravansListPage'
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
import { SupplierCreatePage } from './pages/suppliers/SupplierCreatePage'
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage'
import { SupplierEditPage } from './pages/suppliers/SupplierEditPage'
import { SuppliersListPage } from './pages/suppliers/SuppliersListPage'
import { SupplierItemCreatePage } from './pages/supplier-items/SupplierItemCreatePage'
import { SupplierItemDetailPage } from './pages/supplier-items/SupplierItemDetailPage'
import { SupplierItemEditPage } from './pages/supplier-items/SupplierItemEditPage'
import { SupplierItemsListPage } from './pages/supplier-items/SupplierItemsListPage'
import { AccommodationLoanCreatePage } from './pages/accommodation-loans/AccommodationLoanCreatePage'
import { AccommodationLoanDetailPage } from './pages/accommodation-loans/AccommodationLoanDetailPage'
import { AccommodationLoanEditPage } from './pages/accommodation-loans/AccommodationLoanEditPage'
import { AccommodationLoansListPage } from './pages/accommodation-loans/AccommodationLoansListPage'
import { LoanReportPage } from './pages/accommodation-loans/LoanReportPage'
import { ItemQuotaCreatePage } from './pages/item-quotas/ItemQuotaCreatePage'
import { ItemQuotaDetailPage } from './pages/item-quotas/ItemQuotaDetailPage'
import { ItemQuotaEditPage } from './pages/item-quotas/ItemQuotaEditPage'
import { ItemQuotasListPage } from './pages/item-quotas/ItemQuotasListPage'
import { IssueVoucherPage } from './pages/item-quota-vouchers/IssueVoucherPage'
import { ItemQuotaVoucherCreatePage } from './pages/item-quota-vouchers/ItemQuotaVoucherCreatePage'
import { ItemQuotaVoucherDetailPage } from './pages/item-quota-vouchers/ItemQuotaVoucherDetailPage'
import { ItemQuotaVoucherEditPage } from './pages/item-quota-vouchers/ItemQuotaVoucherEditPage'
import { ItemQuotaVouchersAdminListPage } from './pages/item-quota-vouchers/ItemQuotaVouchersAdminListPage'
import { ItemQuotaVouchersListPage } from './pages/item-quota-vouchers/ItemQuotaVouchersListPage'
import { ItemQuotaVoucherReportPage } from './pages/item-quota-vouchers/ItemQuotaVoucherReportPage'
import { MyVoucherDetailPage } from './pages/item-quota-vouchers/MyVoucherDetailPage'
import { MyVouchersListPage } from './pages/item-quota-vouchers/MyVouchersListPage'
import { MyLoanDetailPage } from './pages/accommodation-loans/MyLoanDetailPage'
import { MyLoansListPage } from './pages/accommodation-loans/MyLoansListPage'
import { IceVoucherCreatePage, IceVoucherEditPage, MyIceVoucherCreatePage } from './pages/ice-vouchers/MyIceVoucherCreatePage'
import { IceVoucherDetailPage } from './pages/ice-vouchers/IceVoucherDetailPage'
import { IceVoucherReportPage } from './pages/ice-vouchers/IceVoucherReportPage'
import { IceVouchersListPage } from './pages/ice-vouchers/IceVouchersListPage'
import { LogisticsSettingsPage } from './pages/ice-vouchers/LogisticsSettingsPage'
import { MyIceVoucherDetailPage } from './pages/ice-vouchers/MyIceVoucherDetailPage'
import { MyIceVouchersListPage } from './pages/ice-vouchers/MyIceVouchersListPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RequireMenuAccess } from './routes/RequireMenuAccess'
import { PublicIceVoucherPage } from './pages/public-vouchers/PublicIceVoucherPage'
import { PublicItemVoucherPage } from './pages/public-vouchers/PublicItemVoucherPage'

const queryClient = new QueryClient()

function AppToaster() {
  const { i18n } = useTranslation()
  const lang = (i18n.language.split('-')[0] as AppLanguage) || 'fa'
  return (
    <Toaster
      richColors
      position="top-left"
      className="app-toaster"
      swipeDirections={['left', 'right']}
      dir={languages[lang]?.dir ?? 'rtl'}
    />
  )
}

export default function App() {
  useSelectNumberOnFocus()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/v/item/:code" element={<PublicItemVoucherPage />} />
            <Route path="/v/ice/:code" element={<PublicIceVoucherPage />} />
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
                <Route element={<RequireMenuAccess path="/caravans" />}>
                  <Route path="/caravans" element={<CaravansListPage />} />
                  <Route path="/caravans/new" element={<CaravanCreatePage />} />
                  <Route path="/caravans/:id/pilgrimage-history" element={<CaravanPilgrimageHistoryPage />} />
                  <Route path="/caravans/:id/edit" element={<CaravanEditPage />} />
                  <Route path="/caravans/:id" element={<CaravanDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/my-caravans" />}>
                  <Route path="/my-caravans" element={<MyCaravansListPage />} />
                  <Route path="/my-caravans/new" element={<MyCaravanCreatePage />} />
                  <Route
                    path="/my-caravans/:id/pilgrimage-history"
                    element={<CaravanPilgrimageHistoryPage />}
                  />
                </Route>
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
                <Route element={<RequireMenuAccess path="/logistics/suppliers" />}>
                  <Route path="/logistics/suppliers" element={<SuppliersListPage />} />
                  <Route path="/logistics/suppliers/new" element={<SupplierCreatePage />} />
                  <Route path="/logistics/suppliers/:supplierId/items" element={<SupplierItemsListPage />} />
                  <Route path="/logistics/suppliers/:supplierId/items/new" element={<SupplierItemCreatePage />} />
                  <Route path="/logistics/suppliers/:supplierId/items/:id" element={<SupplierItemDetailPage />} />
                  <Route path="/logistics/suppliers/:supplierId/items/:id/edit" element={<SupplierItemEditPage />} />
                  <Route path="/logistics/suppliers/:id" element={<SupplierDetailPage />} />
                  <Route path="/logistics/suppliers/:id/edit" element={<SupplierEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/loans" />}>
                  <Route path="/logistics/loans" element={<AccommodationLoansListPage />} />
                  <Route path="/logistics/loans/new" element={<AccommodationLoanCreatePage />} />
                  <Route path="/logistics/loans/:id" element={<AccommodationLoanDetailPage />} />
                  <Route path="/logistics/loans/:id/edit" element={<AccommodationLoanEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/loan-report" />}>
                  <Route path="/logistics/loan-report" element={<LoanReportPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/item-quotas" />}>
                  <Route path="/logistics/item-quotas" element={<ItemQuotasListPage />} />
                  <Route path="/logistics/item-quotas/new" element={<ItemQuotaCreatePage />} />
                  <Route path="/logistics/item-quotas/:quotaId/vouchers" element={<ItemQuotaVouchersListPage />} />
                  <Route path="/logistics/item-quotas/:quotaId/vouchers/new" element={<ItemQuotaVoucherCreatePage />} />
                  <Route path="/logistics/item-quotas/:quotaId/vouchers/:id" element={<ItemQuotaVoucherDetailPage />} />
                  <Route path="/logistics/item-quotas/:quotaId/vouchers/:id/edit" element={<ItemQuotaVoucherEditPage />} />
                  <Route path="/logistics/item-quotas/:id" element={<ItemQuotaDetailPage />} />
                  <Route path="/logistics/item-quotas/:id/edit" element={<ItemQuotaEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/issue-voucher" />}>
                  <Route path="/logistics/issue-voucher" element={<IssueVoucherPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/vouchers" />}>
                  <Route path="/logistics/vouchers" element={<ItemQuotaVouchersAdminListPage />} />
                  <Route
                    path="/logistics/vouchers/new"
                    element={
                      <IssueVoucherPage
                        titleKey="itemQuotaVouchers.create"
                        successPath={(id) => `/logistics/vouchers/${id}`}
                      />
                    }
                  />
                  <Route path="/logistics/vouchers/:id" element={<ItemQuotaVoucherDetailPage />} />
                  <Route path="/logistics/vouchers/:id/edit" element={<ItemQuotaVoucherEditPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/voucher-report" />}>
                  <Route path="/logistics/voucher-report" element={<ItemQuotaVoucherReportPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/my-vouchers" />}>
                  <Route path="/logistics/my-vouchers" element={<MyVouchersListPage />} />
                  <Route path="/logistics/my-vouchers/:id" element={<MyVoucherDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/my-loans" />}>
                  <Route path="/logistics/my-loans" element={<MyLoansListPage />} />
                  <Route path="/logistics/my-loans/:id" element={<MyLoanDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/settings" />}>
                  <Route path="/logistics/settings" element={<LogisticsSettingsPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/ice-vouchers" />}>
                  <Route path="/logistics/ice-vouchers" element={<IceVouchersListPage />} />
                  <Route
                    path="/logistics/ice-vouchers/new"
                    element={<IceVoucherCreatePage basePath="/logistics/ice-vouchers" />}
                  />
                  <Route path="/logistics/ice-vouchers/:id/edit" element={<IceVoucherEditPage />} />
                  <Route path="/logistics/ice-vouchers/:id" element={<IceVoucherDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/my-ice-vouchers" />}>
                  <Route path="/logistics/my-ice-vouchers" element={<MyIceVouchersListPage />} />
                  <Route path="/logistics/my-ice-vouchers/new" element={<MyIceVoucherCreatePage />} />
                  <Route path="/logistics/my-ice-vouchers/:id" element={<MyIceVoucherDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/ice-voucher-report" />}>
                  <Route path="/logistics/ice-voucher-report" element={<IceVoucherReportPage />} />
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
