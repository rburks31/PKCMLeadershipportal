import { Router } from "express";
import { validateMergeFields, replaceMergeFields } from "../mergeFields";
import { GroupService, buildMergeContext } from "../groupService";
import { sendSMS } from "../smsService";
import { isAuthenticated } from "../auth";

// Admin middleware to check admin role
const isAdmin = async (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user has admin role directly from the user object
  if (user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  req.adminUser = user;
  next();
};

const router = Router();

// Group messaging endpoint
router.post("/messages/group", isAuthenticated, isAdmin, async (req, res) => {
  const { groupId, content } = req.body;
  
  if (!groupId || !content) {
    return res.status(400).json({ 
      error: "Group ID and content are required"
    });
  }

  // Validate merge fields
  const invalidFields = validateMergeFields(content);
  if (invalidFields.length > 0) {
    return res.status(400).json({ 
      error: `Invalid merge fields: ${invalidFields.join(", ")}`
    });
  }

  try {
    const group = await GroupService.getGroupWithMembers(groupId);
    
    // Filter members who have phone numbers
    const membersWithPhones = group.members.filter(member => member.phone);
    
    if (membersWithPhones.length === 0) {
      return res.status(400).json({ 
        error: "No group members have phone numbers"
      });
    }

    const messagePromises = membersWithPhones.map(member => {
      const context = buildMergeContext(member);
      const personalizedMessage = replaceMergeFields(content, context);
      
      return sendSMS({
        to: member.phone!,
        message: personalizedMessage
      });
    });

    const results = await Promise.all(messagePromises);
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    res.json({ 
      success: true, 
      total: results.length,
      successful: successCount,
      failed: failureCount,
      groupName: group.name
    });
  } catch (error) {
    console.error("Group messaging failed:", error);
    res.status(500).json({ error: "Group messaging failed" });
  }
});

// Send message to users by role
router.post("/messages/role", isAuthenticated, isAdmin, async (req, res) => {
  const { role, content } = req.body;
  
  if (!role || !content) {
    return res.status(400).json({ 
      error: "Role and content are required"
    });
  }

  // Validate merge fields
  const invalidFields = validateMergeFields(content);
  if (invalidFields.length > 0) {
    return res.status(400).json({ 
      error: `Invalid merge fields: ${invalidFields.join(", ")}`
    });
  }

  try {
    const group = await GroupService.getUsersByRole(role);
    
    // Filter members who have phone numbers
    const membersWithPhones = group.members.filter(member => member.phone);
    
    if (membersWithPhones.length === 0) {
      return res.status(400).json({ 
        error: `No ${role} users have phone numbers`
      });
    }

    const messagePromises = membersWithPhones.map(member => {
      const context = buildMergeContext(member);
      const personalizedMessage = replaceMergeFields(content, context);
      
      return sendSMS({
        to: member.phone!,
        message: personalizedMessage
      });
    });

    const results = await Promise.all(messagePromises);
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    res.json({ 
      success: true, 
      total: results.length,
      successful: successCount,
      failed: failureCount,
      role: role
    });
  } catch (error) {
    console.error("Role-based messaging failed:", error);
    res.status(500).json({ error: "Role-based messaging failed" });
  }
});

// Send message to all active users
router.post("/messages/all", isAuthenticated, isAdmin, async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ 
      error: "Content is required"
    });
  }

  // Validate merge fields
  const invalidFields = validateMergeFields(content);
  if (invalidFields.length > 0) {
    return res.status(400).json({ 
      error: `Invalid merge fields: ${invalidFields.join(", ")}`
    });
  }

  try {
    const group = await GroupService.getAllActiveUsers();
    
    // Filter members who have phone numbers
    const membersWithPhones = group.members.filter(member => member.phone);
    
    if (membersWithPhones.length === 0) {
      return res.status(400).json({ 
        error: "No active users have phone numbers"
      });
    }

    const messagePromises = membersWithPhones.map(member => {
      const context = buildMergeContext(member);
      const personalizedMessage = replaceMergeFields(content, context);
      
      return sendSMS({
        to: member.phone!,
        message: personalizedMessage
      });
    });

    const results = await Promise.all(messagePromises);
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    res.json({ 
      success: true, 
      total: results.length,
      successful: successCount,
      failed: failureCount
    });
  } catch (error) {
    console.error("Broadcast messaging failed:", error);
    res.status(500).json({ error: "Broadcast messaging failed" });
  }
});

export default router;