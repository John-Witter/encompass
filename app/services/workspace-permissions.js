Encompass.WorkspacePermissionsService = Ember.Service.extend(Encompass.CurrentUserMixin, {
  utils: Ember.inject.service('utility-methods'),

  isAdmin() {
    return this.get('currentUser.isAdmin');
  },

  isPdAdmin() {
    return this.get('currentUser.isPdAdmin');
  },

  isOwner(ws) {
    let ownerId = this.get('utils').getBelongsToId(ws, 'owner');
    return ownerId === this.get('currentUser.id');
  },

  isCreator(ws) {
    let creatorId = this.get('utils').getBelongsToId('ws', 'createdBy');
    return creatorId === this.get('currentUser.id');
  },

  isInPdAdminDomain(ws) {
    if (!this.isPdAdmin) {
      return false;
    }

    let userOrg = this.get('currentUser.organization.content');
    let ownerOrg = ws.get('owner.organization.content');
    return Ember.isEqual(ownerOrg, userOrg);
  },

  canDelete(ws) {
    return this.isAdmin() || this.isCreator(ws) || this.isOwner(ws);
  },

  hasOwnerPrivileges(ws) {
    return this.isAdmin() || this.isOwner(ws) || this.isCreator(ws) || this.isInPdAdminDomain(ws);
  },

  canCopy(ws) {
    // let canCopy = ws.get('canCopy');
    // have to add a check is workspace is allowed to be copied
    if (this.canDelete(ws) || this.isPdAdmin() && this.isInPdAdminDomain(ws)) {
      return true;
    } else {
      return false;
    }
  },
  isFeedbackApprover(ws) {
    if (!ws) {
      return false;
    }

   let approvers = ws.get('feedbackAuthorizers') || [];
   return approvers.includes(this.get('currentUser.id'));
  },

  canApproveFeedback(ws) {
    if (!ws) {
      return false;
    }
    return this.isAdmin() || this.isOwner(ws) || this.isCreator(ws) || this.isFeedbackApprover(ws) || this.isInPdAdminDomain(ws);
  },

  canEdit(ws, recordType, requiredPermissionLevel) {
    const utils = this.get('utils');
    if (!utils.isNonEmptyObject(ws)) {
      return false;
    }

    if (this.isAdmin() || this.isOwner(ws) || this.isCreator(ws) || this.isInPdAdminDomain(ws)) {
      return true;
    }

    // check ws permissions

    const wsPermissions = ws.get('permissions');
    if (!utils.isNonEmptyArray(wsPermissions)) {
      return false;
    }

    const userPermissions = wsPermissions.findBy('user', this.get('currentUser.id'));
    if (!utils.isNonEmptyObject(userPermissions)) {
      return false;
    }

    const globalSetting = userPermissions.global;

    if (globalSetting === 'viewOnly') {
      return false;
    }
    if (globalSetting === 'approver') {
      return true;
    }

    if (recordType !== 'feedback' && globalSetting === 'editor') {
      return true;
    }

    // else custom

    const permissionLevel = userPermissions[recordType];

    if (recordType === 'feedback') {
      // to determine if user can respond at all
      if (requiredPermissionLevel === 1) {
        return permissionLevel !== 'none';
      }
      // to determine if user has direct send privileges
      if (requiredPermissionLevel === 2) {
        return permissionLevel === 'preAuth' || permissionLevel === 'approver';
      }
    }

    return permissionLevel >= requiredPermissionLevel;
  },

});
