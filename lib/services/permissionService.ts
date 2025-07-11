import connectMongo from '@/lib/mongodb';
import { User, Role } from '@/lib/models';

export interface UserPermissions {
  dashboard: boolean;
  pdv: boolean;
  products: boolean;
  inventory: boolean;
  reports: boolean;
  customers: boolean;
  campaigns: boolean;
  settings: boolean;
  employees: boolean;
  categories: boolean;
}

export class PermissionService {
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    await connectMongo();
    
    const user = await User.findById(userId).populate('roleId');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Admin has all permissions
    if (user.role === 'admin') {
      return {
        dashboard: true,
        pdv: true,
        products: true,
        inventory: true,
        reports: true,
        customers: true,
        campaigns: true,
        settings: true,
        employees: true,
        categories: true,
      };
    }

    // Use custom permissions if available
    if (user.customPermissions) {
      return user.customPermissions;
    }

    // Use role permissions if role is assigned
    if (user.roleId && user.roleId.permissions) {
      return user.roleId.permissions;
    }

    // Default permissions based on legacy role
    const defaultPermissions: Record<string, UserPermissions> = {
      vendedor: {
        dashboard: true,
        pdv: true,
        products: true,
        inventory: false,
        reports: false,
        customers: true,
        campaigns: true,
        settings: false,
        employees: false,
        categories: false,
      },
      caixa: {
        dashboard: true,
        pdv: true,
        products: false,
        inventory: false,
        reports: false,
        customers: false,
        campaigns: false,
        settings: false,
        employees: false,
        categories: false,
      },
      estoque: {
        dashboard: true,
        pdv: false,
        products: true,
        inventory: true,
        reports: false,
        customers: false,
        campaigns: false,
        settings: false,
        employees: false,
        categories: false,
      },
    };

    return defaultPermissions[user.role] || defaultPermissions.vendedor;
  }

  static async hasPermission(userId: string, permission: keyof UserPermissions): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions[permission];
  }
}