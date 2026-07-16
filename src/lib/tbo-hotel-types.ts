export interface TBOError {
  ErrorCode: number;
  ErrorMessage: string;
}

export interface TBOStatus {
  Code: number;
  Description: string;
}

export interface TBOHotelAuthRequest {
  ClientId: string;
  UserName: string;
  Password: string;
  EndUserIp: string;
}

export interface TBOHotelAuthResponse {
  Status: number;
  TokenId: string;
  Error: TBOError | null;
  Member: unknown | null;
}

export const HOTEL_BOOKING_MODE = 5;

export interface TBOHotelPaxRoom {
  Adults: number;
  Children: number;
  ChildrenAges: number[];
}

export interface TBOSearchFilters {
  Refundable: boolean;
  NoOfRooms: number;
  MealType: string | null;
  StarRating: number | null;
}

export interface TBOHotelSearchRequest {
  CheckIn: string;
  CheckOut: string;
  HotelCodes: string;
  GuestNationality: string;
  PaxRooms: TBOHotelPaxRoom[];
  ResponseTime?: number;
  IsDetailedResponse?: boolean;
  Filters?: TBOSearchFilters;
  PreferredCurrency?: string;
  IsNearBySearch?: boolean;
  MaxRating?: number;
  MinRating?: number;
  ReviewCount?: number;
  SearchedCities?: string[];
  EndUserIp?: string;
  TokenId?: string;
}

export interface TBOHotelDayRate {
  BasePrice: number;
  ExtraGuest: number;
  Child: number;
}

export interface TBOHotelCancelPolicy {
  Index: string;
  FromDate: string;
  ChargeType: string;
  CancellationCharge: number;
}

export interface TBOHotelSupplement {
  Index: number;
  Type: string;
  Description: string;
  Price: number;
  Currency: string;
}

export interface TBOHotelRoom {
  Name: string[];
  BookingCode: string;
  Inclusion: string;
  DayRates?: TBOHotelDayRate[][];
  SelectedDateRange?: string;
  TotalFare: number;
  TotalTax: number;
  RoomID?: string[];
  RoomPromotion?: string[];
  CancelPolicies?: TBOHotelCancelPolicy[];
  MealType: string;
  IsRefundable: boolean;
  Supplements?: TBOHotelSupplement[][];
  WithTransfers: boolean;
}

export interface TBOHotelResult {
  HotelCode: string;
  Currency: string;
  Rooms: TBOHotelRoom[];
}

export interface TBOHotelSearchResponse {
  Status: TBOStatus;
  HotelResult: TBOHotelResult[];
  NoOfRooms: number;
  TraceId?: string;
}

export interface TBOHotelPreBookRequest {
  BookingCode: string;
  PaymentMode: string;
}

export interface TBOHotelValidationInfo {
  PanMandatory: boolean;
  PanPassport: boolean;
  PassportMandatory: boolean;
}

export interface TBOHotelTaxBreakup {
  ChargeType: string;
  Amount: number;
  Description: string;
}

export interface TBOHotelPreBookRoom {
  Name: string[];
  BookingCode: string;
  Supplier: string;
  PassengerSlab: number;
  Currency: string;
  DayRates: TBOHotelDayRate[][];
  TotalFare: number;
  TotalTax: number;
  NetAmount: number;
  NetTax: number;
  Inclusion: string;
  MealType: string;
  IsRefundable: boolean;
  Amenities: string[];
  CancelPolicies: { FromDate: string; ChargeType: string; CancellationCharge: number }[];
  LastCancellationDeadline: string;
  PriceBreakUp: {
    RoomRate: number;
    RoomTax: number;
    AgentCommission: number;
    TaxBreakup: { TaxType: string; TaxableAmount: number; TaxPercentage: number; TaxAmount: number }[];
  }[];
}

export interface TBOHotelPreBookResponse {
  Status: TBOStatus;
  ValidationInfo: TBOHotelValidationInfo;
  HotelResult?: {
    HotelCode: string;
    Currency: string;
    Rooms: TBOHotelPreBookRoom[];
    RateConditions: string[];
  }[];
}

export interface TBOHotelPassenger {
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: number;
  LeadPassenger: boolean;
  Age: number;
  Email?: string;
  Phoneno?: string;
  PassportNo?: string;
  PassportExpiry?: string;
  PAN?: string;
  AddressLine1?: string;
  City?: string;
  CountryCode?: string;
  CountryName?: string;
  Nationality?: string;
}

export interface TBOHotelRoomDetail {
  HotelPassenger: TBOHotelPassenger[];
}

export interface TBOHotelBookRequest {
  BookingCode: string;
  IsVoucherBooking: boolean;
  GuestNationality: string;
  EndUserIp?: string;
  TokenId?: string;
  TraceId?: string;
  RequestedBookingMode: number;
  NetAmount: number;
  TotalFare?: number;
  ClientReferenceId?: string;
  HotelRoomsDetails: TBOHotelRoomDetail[];
}

export interface TBOHotelBookError {
  ErrorCode: number;
  ErrorMessage: string;
}

export interface TBOHotelBookResult {
  VoucherStatus: boolean;
  ResponseStatus: number;
  Error: TBOHotelBookError;
  TraceId: string;
  Status: number;
  HotelBookingStatus: string;
  InvoiceNumber: string;
  ConfirmationNo: string;
  BookingRefNo: string;
  BookingId: number;
  IsPriceChanged: boolean;
  IsCancellationPolicyChanged: boolean;
}

export interface TBOHotelBookResponse {
  BookResult: TBOHotelBookResult;
}

export interface TBOHotelBookingDetailRequest {
  EndUserIp?: string;
  TokenId?: string;
  BookingId?: number;
  TraceId?: string;
}

export interface TBOHotelBookingDetailPassenger {
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: number;
  LeadPassenger: boolean;
  Age: number;
  Email: string;
  Phoneno: string;
  PassportNo?: string;
  PAN?: string;
}

export interface TBOHotelBookingDetailRoom {
  RoomTypeName: string;
  HotelPassenger: TBOHotelBookingDetailPassenger[];
  DayRates: TBOHotelDayRate[][];
  TotalFare: number;
  TotalTax: number;
  MealType: string;
  IsRefundable: boolean;
  CancelPolicies: TBOHotelCancelPolicy[];
  Supplements: TBOHotelSupplement[];
  PriceBreakUp: TBOHotelBookingDetailPriceBreakUp;
}

export interface TBOHotelBookingDetailPriceBreakUp {
  RoomRate: number;
  RoomTax: number;
  RoomExtraGuestCharges: number;
  RoomChildCharges: number;
}

export interface TBOHotelBookingDetailResult {
  ResponseStatus: number;
  Error: TBOError;
  Status: number;
  HotelBookingStatus: string;
  ConfirmationNo: string;
  BookingRefNo: string;
  BookingId: number;
  InvoiceNo: string;
  HotelName: string;
  HotelCode: string;
  Currency: string;
  CheckInDate: string;
  CheckOutDate: string;
  GuestNationality: string;
  IsVoucherBooking: boolean;
  Rooms: TBOHotelBookingDetailRoom[];
  Amenities?: string[];
  NetAmount: number;
  NetTax: number;
  City?: string;
  StarRating?: string;
  AddressLine1?: string;
}

export interface TBOHotelBookingDetailResponse {
  GetBookingDetailResult: TBOHotelBookingDetailResult;
}

export interface TBOHotelCountry {
  Code: string;
  Name: string;
}

export interface TBOHotelCity {
  CityCode: number;
  CityName: string;
  CountryCode: string;
  CountryName: string;
  Name?: string;
  Code?: string;
}

export interface TBOHotelCodeItem {
  HotelCode: string;
  HotelName: string;
  Latitude?: string;
  Longitude?: string;
  HotelRating: string;
  Address?: string;
  CountryName?: string;
  CountryCode?: string;
  CityName?: string;
  CityCode?: number;
  HotelAddress?: string;
  HotelEmail?: string;
  HotelContact?: string;
}

export interface TBOHotelDetail {
  HotelCode: string;
  HotelName: string;
  HotelRating: string;
  HotelAddress?: string;
  Address?: string;
  HotelDescription?: string;
  Description?: string;
  HotelEmail?: string;
  Email?: string;
  HotelContact?: string;
  PhoneNumber?: string;
  HotelWebsite?: string;
  HotelFax?: string;
  HotelPinCode?: string;
  PinCode?: string;
  Amenities?: string[];
  HotelFacilities?: string[];
  Images?: string[];
  Image?: string;
  CountryCode?: string;
  CountryName?: string;
  CityCode?: number;
  CityId?: number;
  CityName?: string;
  Latitude?: number;
  Longitude?: number;
  CheckInTime?: string;
  CheckOutTime?: string;
}

export interface TBOHotelRoomDisplay {
  roomId: string;
  name: string;
  roomName: string;
  bookingCode: string;
  mealType: string;
  isRefundable: boolean;
  totalFare: number;
  totalTax: number;
  inclusion: string;
  dayRates: { basePrice: number; date?: string }[];
  cancelPolicy: string;
  cancellationPolicy: string;
  roomIndex: number;
  typeCode: string;
  ratePlanCode: string;
  roomFare: number;
  roomTax: number;
  currency: string;
  amenities: string[];
}

export interface TBOHotelDisplay {
  hotelCode: number;
  name: string;
  hotelRating: number;
  location: string;
  currency: string;
  minTotalFare: number;
  rooms: TBOHotelRoomDisplay[];
  resultIndex: number;
  picture: string;
  rating: string;
  address: string;
  tripAdvisorRating: number;
  description: string;
  price: number;
  starRating: number;
  originalPrice: number;
  source?: "tbo" | "mock" | "fallback";
  countryCode?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface TBOHotelSearchOutput {
  hotels: TBOHotelDisplay[];
  traceId: string;
}

export interface TBOHotelPreBookOutput {
  hotelName: string;
  hotelCode: string;
  netAmount: number;
  roomRate: number;
  roomTax: number;
  serviceFee: number;
  agentCommission: number;
  tds: number;
  validationInfo: TBOHotelValidationInfo;
  amenities: string[];
  rateConditions: string[];
  taxBreakup: { chargeType: string; taxableAmount: number; taxPercentage: number; amount: number }[];
  traceId: string;
}

export interface TBOHotelBookOutput {
  bookingId: number;
  confirmationNo: string;
  bookingRefNo: string;
  invoiceNumber: string;
  hotelBookingStatus: string;
  isPriceChanged: boolean;
  isCancellationPolicyChanged?: boolean;
}

export interface TBOHotelBookingDetailOutput {
  bookingId: number;
  confirmationNo: string;
  invoiceNumber: string;
  hotelName: string;
  hotelCode: string;
  checkIn: string;
  checkOut: string;
  status: string;
  rooms: {
    roomName: string;
    passengers: { title: string; firstName: string; lastName: string; paxType: number }[];
    totalFare: number;
    totalTax: number;
  }[];
  priceBreakup: {
    roomRate: number;
    roomTax: number;
    extraGuestCharges: number;
    childCharges: number;
    netAmount: number;
  };
}

export type TBODisplayHotel = TBOHotelDisplay;
export type TBODisplayRoom = TBOHotelRoomDisplay;

export interface TBOHotelGenerateVoucherRequest {
  EndUserIp: string;
  BookingId: number;
}

export interface TBOHotelGenerateVoucherResult {
  VoucherStatus: boolean;
  Status: number;
  HotelBookingStatus: string;
  BookingId: number;
  BookingRefNo: string;
  ConfirmationNo: string;
  InvoiceNumber: string;
  ResponseStatus: number;
  TraceId: string;
  Error: TBOError;
}

export interface TBOHotelGenerateVoucherResponse {
  GenerateVoucherResult: TBOHotelGenerateVoucherResult;
}

export interface TBOHotelSendChangeRequest {
  BookingMode: number;
  RequestType: number;
  Remarks: string;
  BookingId: number;
  EndUserIp: string;
  TokenId: string;
}

export interface TBOHotelSendChangeResult {
  ChangeRequestId: number;
  ChangeRequestStatus: number;
  ResponseStatus: number;
  TraceId: string;
  Error: TBOError;
}

export interface TBOHotelSendChangeResponse {
  HotelChangeRequestResult: TBOHotelSendChangeResult;
}

export interface TBOHotelGetChangeRequestStatusRequest {
  BookingMode: number;
  ChangeRequestId: number;
  EndUserIp: string;
  TokenId: string;
}

export interface TBOHotelGetChangeRequestStatusResult {
  ChangeRequestId: number;
  RefundedAmount: number;
  CancellationCharge: number;
  ChangeRequestStatus: number;
  ResponseStatus: number;
  TraceId: string;
  Error: TBOError;
}

export interface TBOHotelGetChangeRequestStatusResponse {
  HotelChangeRequestStatusResult: TBOHotelGetChangeRequestStatusResult;
}

export interface TBOHotelGenerateVoucherOutput {
  voucherStatus: boolean;
  status: number;
  hotelBookingStatus: string;
  bookingId: number;
  confirmationNo: string;
  invoiceNumber: string;
  traceId: string;
}

export interface TBOHotelCancelOutput {
  changeRequestId: number;
  changeRequestStatus: number;
  traceId: string;
}

export interface TBOHotelCancelStatusOutput {
  changeRequestId: number;
  refundedAmount: number;
  cancellationCharge: number;
  changeRequestStatus: number;
  traceId: string;
}
