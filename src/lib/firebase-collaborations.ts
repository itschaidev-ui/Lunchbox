import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { 
  Collaboration, 
  CollabMember, 
  CollabRole, 
  CollabTask, 
  CollabMessage,
  CollabPermission,
  CollabInvite
} from './types';
import { ROLE_TEMPLATES } from './types';

// ==================== Collaborations ====================

export async function createCollaboration(
  userId: string,
  name: string,
  description?: string,
  companion?: { personality?: string; icon?: string; name?: string }
): Promise<string> {
  const collabRef = doc(collection(db, 'collaborations'));
  const now = new Date().toISOString();
  
  const collab: Omit<Collaboration, 'id'> = {
    name,
    description,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
    companion: companion ? {
      enabled: true,
      personality: companion.personality,
      icon: companion.icon || '/images/lunchbox-ai-logo.png',
      name: companion.name || 'Collab Companion',
    } : undefined,
    settings: {
      privacy: 'private',
      allowInvites: true,
      defaultRole: 'member',
    },
  };
  
  await setDoc(collabRef, collab);
  
  // Create default roles from templates
  await createDefaultRoles(collabRef.id, userId);
  
  // Add owner as member with owner role
  const ownerRole = await getRoleByName(collabRef.id, 'Owner');
  if (ownerRole) {
    await addMember(collabRef.id, userId, ownerRole.id, userId);
  }
  
  return collabRef.id;
}

export async function getCollaboration(collabId: string): Promise<Collaboration | null> {
  const collabRef = doc(db, 'collaborations', collabId);
  const snap = await getDoc(collabRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Collaboration;
}

export async function getUserCollaborations(userId: string): Promise<Collaboration[]> {
  // Get all collaborations where user is a member
  const membersQuery = query(
    collection(db, 'collaboration_members'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const membersSnap = await getDocs(membersQuery);
  const collabIds = membersSnap.docs.map(d => d.data().collabId);
  
  if (collabIds.length === 0) return [];
  
  // Fetch all collaborations
  const collabs: Collaboration[] = [];
  for (const id of collabIds) {
    const collab = await getCollaboration(id);
    if (collab) collabs.push(collab);
  }
  
  return collabs.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function updateCollaboration(
  collabId: string,
  updates: Partial<Collaboration>
): Promise<void> {
  const collabRef = doc(db, 'collaborations', collabId);
  await updateDoc(collabRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCollaboration(collabId: string): Promise<void> {
  // Delete all related data
  const membersQuery = query(
    collection(db, 'collaboration_members'),
    where('collabId', '==', collabId)
  );
  const membersSnap = await getDocs(membersQuery);
  for (const memberDoc of membersSnap.docs) {
    await deleteDoc(memberDoc.ref);
  }
  
  const rolesQuery = query(
    collection(db, 'collaboration_roles'),
    where('collabId', '==', collabId)
  );
  const rolesSnap = await getDocs(rolesQuery);
  for (const roleDoc of rolesSnap.docs) {
    await deleteDoc(roleDoc.ref);
  }
  
  const tasksQuery = query(
    collection(db, 'collaboration_tasks'),
    where('collabId', '==', collabId)
  );
  const tasksSnap = await getDocs(tasksQuery);
  for (const taskDoc of tasksSnap.docs) {
    await deleteDoc(taskDoc.ref);
  }
  
  const collabRef = doc(db, 'collaborations', collabId);
  await deleteDoc(collabRef);
}

// ==================== Members ====================

export async function addMember(
  collabId: string,
  userId: string,
  roleId: string,
  invitedBy: string
): Promise<string> {
  // Get user info
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};
  
  // Get Discord username if available
  // discord_links is stored by discordId, not userId, so we need to query by uid
  let discordData: any = {};
  try {
    const discordLinksQuery = query(
      collection(db, 'discord_links'),
      where('uid', '==', userId),
      limit(1)
    );
    const discordLinkSnap = await getDocs(discordLinksQuery);
    if (!discordLinkSnap.empty) {
      discordData = discordLinkSnap.docs[0].data();
    }
  } catch (err) {
    // Discord link not found, continue without it
  }
  
  const memberRef = doc(collection(db, 'collaboration_members'));
  const member: Omit<CollabMember, 'id'> = {
    collabId,
    userId,
    email: userData.email || '',
    displayName: userData.displayName || userData.name || '',
    discordUsername: discordData.username || discordData.discordUsername || undefined,
    roleId,
    joinedAt: new Date().toISOString(),
    invitedBy,
    status: 'active',
  };
  
  await setDoc(memberRef, member);
  return memberRef.id;
}

export async function getMember(collabId: string, userId: string): Promise<CollabMember | null> {
  const membersQuery = query(
    collection(db, 'collaboration_members'),
    where('collabId', '==', collabId),
    where('userId', '==', userId)
  );
  const snap = await getDocs(membersQuery);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as CollabMember;
}

export async function getCollabMembers(collabId: string): Promise<CollabMember[]> {
  const membersQuery = query(
    collection(db, 'collaboration_members'),
    where('collabId', '==', collabId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(membersQuery);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollabMember));
}

// Get pending invitations for a user
export async function getPendingInvitations(userId: string): Promise<Array<CollabMember & { collaboration?: Collaboration }>> {
  const membersQuery = query(
    collection(db, 'collaboration_members'),
    where('userId', '==', userId),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(membersQuery);
  const members = snap.docs.map(d => ({ id: d.id, ...d.data() } as CollabMember));
  
  // Fetch collaboration details for each invitation
  const invitations = await Promise.all(
    members.map(async (member) => {
      const collaboration = await getCollaboration(member.collabId);
      return { ...member, collaboration };
    })
  );
  
  return invitations.filter(inv => inv.collaboration !== null) as Array<CollabMember & { collaboration: Collaboration }>;
}

// Accept an invitation
export async function acceptInvitation(memberId: string): Promise<void> {
  const memberRef = doc(db, 'collaboration_members', memberId);
  await updateDoc(memberRef, { 
    status: 'active',
    joinedAt: new Date().toISOString()
  });
}

// Decline an invitation
export async function declineInvitation(memberId: string): Promise<void> {
  const memberRef = doc(db, 'collaboration_members', memberId);
  await updateDoc(memberRef, { status: 'left' });
}

// ==================== Invite Links ====================

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create an invite link for a collaboration
export async function createInviteLink(
  collabId: string,
  createdBy: string,
  roleId: string,
  expiresAt?: string,
  maxUses?: number
): Promise<string> {
  // Generate unique code
  let code = generateInviteCode();
  let attempts = 0;
  
  // Ensure code is unique (check if it exists)
  while (attempts < 10) {
    const existingInvite = await getInviteByCode(code);
    if (!existingInvite) break;
    code = generateInviteCode();
    attempts++;
  }
  
  const inviteRef = doc(collection(db, 'collaboration_invites'));
  
  // Build invite object, only including defined fields (Firestore doesn't allow undefined)
  const inviteData: any = {
    collabId,
    code,
    createdBy,
    createdAt: new Date().toISOString(),
    uses: 0,
    roleId,
    isActive: true,
  };
  
  // Only add optional fields if they're defined
  if (expiresAt !== undefined && expiresAt !== null) {
    inviteData.expiresAt = expiresAt;
  }
  if (maxUses !== undefined && maxUses !== null) {
    inviteData.maxUses = maxUses;
  }
  
  await setDoc(inviteRef, inviteData);
  return code;
}

// Get invite by code
export async function getInviteByCode(code: string): Promise<(CollabInvite & { collaboration?: Collaboration }) | null> {
  const invitesQuery = query(
    collection(db, 'collaboration_invites'),
    where('code', '==', code),
    limit(1)
  );
  const snap = await getDocs(invitesQuery);
  if (snap.empty) return null;
  
  const invite = { id: snap.docs[0].id, ...snap.docs[0].data() } as CollabInvite;
  
  // Check if invite is valid
  if (!invite.isActive) return null;
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return null;
  if (invite.maxUses && invite.uses >= invite.maxUses) return null;
  
  // Fetch collaboration
  const collaboration = await getCollaboration(invite.collabId);
  
  if (!collaboration) return null;
  
  return { ...invite, collaboration };
}

// Get all invite links for a collaboration
export async function getCollabInvites(collabId: string): Promise<CollabInvite[]> {
  const invitesQuery = query(
    collection(db, 'collaboration_invites'),
    where('collabId', '==', collabId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(invitesQuery);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollabInvite));
}

// Accept an invite link (join collaboration via invite code)
export async function acceptInviteLink(
  code: string,
  userId: string
): Promise<{ success: boolean; collabId?: string; error?: string }> {
  const inviteData = await getInviteByCode(code);
  
  if (!inviteData || !inviteData.collaboration) {
    return { success: false, error: 'Invalid or expired invite link' };
  }
  
  const invite = inviteData as CollabInvite & { collaboration: Collaboration };
  
  // Check if user is already a member
  const existingMember = await getMember(invite.collabId, userId);
  if (existingMember && existingMember.status === 'active') {
    return { success: false, error: 'You are already a member of this collaboration' };
  }
  
  // If user was previously a member (left), reactivate them
  if (existingMember && existingMember.status === 'left') {
    const memberRef = doc(db, 'collaboration_members', existingMember.id);
    await updateDoc(memberRef, {
      status: 'active',
      roleId: invite.roleId,
      joinedAt: new Date().toISOString(),
    });
  } else {
    // Add as new member
    await addMember(invite.collabId, userId, invite.roleId, invite.createdBy);
  }
  
  // Increment invite uses
  const inviteRef = doc(db, 'collaboration_invites', invite.id);
  await updateDoc(inviteRef, {
    uses: invite.uses + 1,
  });
  
  return { success: true, collabId: invite.collabId };
}

// Revoke an invite link
export async function revokeInviteLink(inviteId: string): Promise<void> {
  const inviteRef = doc(db, 'collaboration_invites', inviteId);
  await updateDoc(inviteRef, { isActive: false });
}

// Delete an invite link
export async function deleteInviteLink(inviteId: string): Promise<void> {
  const inviteRef = doc(db, 'collaboration_invites', inviteId);
  await deleteDoc(inviteRef);
}

export async function updateMemberRole(
  collabId: string,
  userId: string,
  roleId: string
): Promise<void> {
  const member = await getMember(collabId, userId);
  if (!member) throw new Error('Member not found');
  const memberRef = doc(db, 'collaboration_members', member.id);
  await updateDoc(memberRef, { roleId });
}

export async function removeMember(collabId: string, userId: string): Promise<void> {
  const member = await getMember(collabId, userId);
  if (!member) return;
  const memberRef = doc(db, 'collaboration_members', member.id);
  await updateDoc(memberRef, { status: 'left' });
}

// ==================== Roles ====================

async function createDefaultRoles(collabId: string, createdBy: string): Promise<void> {
  const now = new Date().toISOString();
  
  for (const template of ROLE_TEMPLATES) {
    const roleRef = doc(collection(db, 'collaboration_roles'));
    const role: CollabRole = {
      id: roleRef.id,
      collabId,
      name: template.name,
      description: template.description,
      permissions: template.permissions,
      isTemplate: template.isTemplate,
      isDefault: template.isDefault || false,
      createdAt: now,
      createdBy,
    };
    await setDoc(roleRef, role);
  }
}

export async function getRole(collabId: string, roleId: string): Promise<CollabRole | null> {
  const roleRef = doc(db, 'collaboration_roles', roleId);
  const snap = await getDoc(roleRef);
  if (!snap.exists() || snap.data().collabId !== collabId) return null;
  return { id: snap.id, ...snap.data() } as CollabRole;
}

export async function getRoleByName(collabId: string, name: string): Promise<CollabRole | null> {
  const rolesQuery = query(
    collection(db, 'collaboration_roles'),
    where('collabId', '==', collabId),
    where('name', '==', name)
  );
  const snap = await getDocs(rolesQuery);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as CollabRole;
}

export async function getCollabRoles(collabId: string): Promise<CollabRole[]> {
  const rolesQuery = query(
    collection(db, 'collaboration_roles'),
    where('collabId', '==', collabId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(rolesQuery);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollabRole));
}

export async function createRole(
  collabId: string,
  name: string,
  description: string,
  permissions: CollabPermission[],
  createdBy: string
): Promise<string> {
  const roleRef = doc(collection(db, 'collaboration_roles'));
  const role: Omit<CollabRole, 'id'> = {
    collabId,
    name,
    description,
    permissions,
    isTemplate: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    createdBy,
  };
  await setDoc(roleRef, role);
  return roleRef.id;
}

export async function updateRole(
  roleId: string,
  updates: Partial<CollabRole>
): Promise<void> {
  const roleRef = doc(db, 'collaboration_roles', roleId);
  await updateDoc(roleRef, updates);
}

export async function deleteRole(roleId: string): Promise<void> {
  const roleRef = doc(db, 'collaboration_roles', roleId);
  await deleteDoc(roleRef);
}

// ==================== Permissions ====================

export async function hasPermission(
  collabId: string,
  userId: string,
  permission: CollabPermission
): Promise<boolean> {
  const member = await getMember(collabId, userId);
  if (!member) return false;
  
  const role = await getRole(collabId, member.roleId);
  if (!role) return false;
  
  return role.permissions.includes(permission);
}

// ==================== Tasks ====================

export async function createCollabTask(
  collabId: string,
  userId: string,
  task: Omit<CollabTask, 'id' | 'collabId' | 'createdBy'>
): Promise<string> {
  const taskRef = doc(collection(db, 'collaboration_tasks'));
  
  // Remove undefined values (Firestore doesn't allow undefined)
  const cleanTask: any = {
    text: task.text,
    completed: task.completed || false,
    collabId,
    createdBy: userId,
    isShared: task.isShared || false,
  };
  
  // Only add optional fields if they're defined
  if (task.dueDate !== undefined && task.dueDate !== null) {
    cleanTask.dueDate = task.dueDate;
  }
  if (task.description !== undefined && task.description !== null) {
    cleanTask.description = task.description;
  }
  if (task.tags !== undefined && task.tags !== null && task.tags.length > 0) {
    cleanTask.tags = task.tags;
  }
  if (task.tagColors !== undefined && task.tagColors !== null) {
    cleanTask.tagColors = task.tagColors;
  }
  if (task.starred !== undefined) {
    cleanTask.starred = task.starred;
  }
  if (task.assignedTo !== undefined && task.assignedTo !== null && task.assignedTo.length > 0) {
    cleanTask.assignedTo = task.assignedTo;
  }
  if (task.sharedAt !== undefined && task.sharedAt !== null) {
    cleanTask.sharedAt = task.sharedAt;
  }
  
  // Add timestamps
  const now = new Date().toISOString();
  cleanTask.createdAt = now;
  cleanTask.updatedAt = now;
  
  await setDoc(taskRef, cleanTask);
  return taskRef.id;
}

export async function getCollabTasks(collabId: string): Promise<CollabTask[]> {
  const tasksQuery = query(
    collection(db, 'collaboration_tasks'),
    where('collabId', '==', collabId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(tasksQuery);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollabTask));
}

export async function updateCollabTask(
  taskId: string,
  updates: Partial<CollabTask>
): Promise<void> {
  const taskRef = doc(db, 'collaboration_tasks', taskId);
  
  // Remove undefined values (Firestore doesn't allow undefined)
  const cleanUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  }
  
  // Always update updatedAt
  cleanUpdates.updatedAt = new Date().toISOString();
  
  await updateDoc(taskRef, cleanUpdates);
}

export async function deleteCollabTask(taskId: string): Promise<void> {
  const taskRef = doc(db, 'collaboration_tasks', taskId);
  await deleteDoc(taskRef);
}

// ==================== Messages ====================

export async function sendMessage(
  collabId: string,
  userId: string | null,
  userName: string,
  content: string,
  isCompanion: boolean = false
): Promise<string> {
  const messageRef = doc(collection(db, 'collaboration_messages'));
  const message: Omit<CollabMessage, 'id'> = {
    collabId,
    userId: userId || '',
    userName,
    content,
    isCompanion,
    createdAt: new Date().toISOString(),
  };
  await setDoc(messageRef, message);
  return messageRef.id;
}

export async function getCollabMessages(
  collabId: string,
  limitCount: number = 50
): Promise<CollabMessage[]> {
  const messagesQuery = query(
    collection(db, 'collaboration_messages'),
    where('collabId', '==', collabId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(messagesQuery);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as CollabMessage))
    .reverse(); // Reverse to show oldest first
}

export function subscribeToCollabMessages(
  collabId: string,
  callback: (messages: CollabMessage[]) => void
): () => void {
  const messagesQuery = query(
    collection(db, 'collaboration_messages'),
    where('collabId', '==', collabId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  
  return onSnapshot(messagesQuery, (snap) => {
    const messages = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as CollabMessage))
      .reverse();
    callback(messages);
  });
}

// ==================== User Search ====================

export async function searchUsers(searchQuery: string): Promise<Array<{
  userId: string;
  email: string;
  displayName?: string;
  discordUsername?: string;
}>> {
  const searchLower = searchQuery.toLowerCase().trim();
  if (!searchLower || searchLower.length < 2) return [];
  
  // Use API route for better search functionality
  try {
    const response = await fetch(`/api/collabs/search-users?q=${encodeURIComponent(searchQuery)}`);
    if (!response.ok) {
      console.error('Search API error:', response.statusText);
      return [];
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

