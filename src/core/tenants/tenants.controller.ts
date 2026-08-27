import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/auth.types';
import { TenantsService, updateTenantSchema } from './tenants.service';
import { z } from 'zod';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('current')
  @RequirePermissions(PERMISSIONS.TENANT_VIEW)
  @ApiOperation({ summary: 'Get the current tenant' })
  current(@CurrentUser() user: AuthUser) {
    return this.tenants.getByIdForTenant(user.tenantId, user.tenantId);
  }

  @Patch('current')
  @RequirePermissions(PERMISSIONS.TENANT_UPDATE)
  @ApiOperation({ summary: 'Update the current tenant' })
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateTenantSchema))
    body: z.infer<typeof updateTenantSchema>,
  ) {
    return this.tenants.updateCurrent(user.tenantId, user.id, body);
  }
}
