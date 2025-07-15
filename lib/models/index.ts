// Central model registration to avoid MissingSchemaError
import User from './User';
import Product from './Product';
import Category from './Category';
import Customer from './Customer';
import Sale from './Sale';
import Role from './Role';
import Settings from './Settings';
import PaymentSettings from './PaymentSettings';
import StockMovement from './StockMovement';
import Campaign from './Campaign';
import Referral from './Referral';
import Fiado from './Fiado';
import TimeTracking from './TimeTracking';
import CashRegister from './CashRegister';
import CashMovement from './CashMovement';
import CommissionSettings from './CommissionSettings';
import PayrollEntry from './PayrollEntry';
import Insight from './Insight';
import AnalyticsSettings from './AnalyticsSettings';
import ThemeSettings from './ThemeSettings';

// Export all models to ensure they are registered
export {
  User,
  Product,
  Category,
  Customer,
  Sale,
  Role,
  Settings,
  PaymentSettings,
  StockMovement,
  Campaign,
  Referral,
  Fiado,
  TimeTracking,
  CashRegister,
  CashMovement,
  CommissionSettings,
  PayrollEntry,
  Insight,
  AnalyticsSettings,
  ThemeSettings,
};

// Function to ensure all models are registered
export function registerModels() {
  // This function ensures all models are imported and registered
  // Call this before any database operations
  return {
    User,
    Product,
    Category,
    Customer,
    Sale,
    Role,
    Settings,
    PaymentSettings,
    StockMovement,
    Campaign,
    Referral,
    Fiado,
    TimeTracking,
    CashRegister,
    CashMovement,
    CommissionSettings,
    PayrollEntry,
    Insight,
    AnalyticsSettings,
    ThemeSettings,
  };
}