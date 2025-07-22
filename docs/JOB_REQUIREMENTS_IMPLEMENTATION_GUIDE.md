# Job Requirements System Implementation Guide 📋

## Overview
This guide shows you how to implement a comprehensive job requirements system that allows you to define requirements at the property level and automatically apply them to jobs.

---

## 🏗️ **System Architecture**

### **1. Property-Level Requirements Template**
Add job requirements templates to properties that serve as defaults for all jobs at that property.

### **2. Job-Specific Requirements Override**
Allow job creators to use property defaults or customize requirements for specific jobs.

### **3. Mobile App Integration**
The completion wizard will automatically load and validate these requirements.

---

## 🎯 **Implementation Options**

### **Option 1: Property-Based Templates (Recommended)**

#### **Benefits:**
- ✅ **Consistency** - All jobs at a property use the same requirements
- ✅ **Efficiency** - Set once, use for all jobs
- ✅ **Scalability** - Easy to manage across many properties
- ✅ **Flexibility** - Can override per job if needed

#### **Implementation:**
```typescript
// Already added to propertyService.ts
export interface PropertyRequirementTemplate {
  id: string;
  description: string;
  isRequired: boolean;
  category: 'safety' | 'cleaning' | 'maintenance' | 'inspection' | 'photo' | 'other';
  estimatedTime?: number; // minutes
  notes?: string;
}

export interface Property {
  // ... existing fields
  requirementsTemplate?: PropertyRequirementTemplate[];
}
```

### **Option 2: Job Type Templates**
Define requirements by job type (cleaning, maintenance, inspection).

### **Option 3: Hybrid Approach**
Combine property-specific and job-type requirements.

---

## 🖥️ **Webapp Implementation**

### **1. Property Management Page**

Add a "Job Requirements" section to your property management interface:

```tsx
// In your webapp property edit form
const PropertyRequirementsSection = ({ property, onUpdate }) => {
  const [requirements, setRequirements] = useState(property.requirementsTemplate || []);

  const addRequirement = () => {
    const newRequirement = {
      id: `req_${Date.now()}`,
      description: '',
      isRequired: true,
      category: 'other',
      estimatedTime: 5,
      notes: ''
    };
    setRequirements([...requirements, newRequirement]);
  };

  const updateRequirement = (id, updates) => {
    setRequirements(reqs => 
      reqs.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  const deleteRequirement = (id) => {
    setRequirements(reqs => reqs.filter(req => req.id !== id));
  };

  const saveRequirements = async () => {
    await onUpdate({ requirementsTemplate: requirements });
  };

  return (
    <div className="requirements-section">
      <h3>Job Requirements Template</h3>
      <p>These requirements will be applied to all jobs created for this property.</p>
      
      {requirements.map(req => (
        <div key={req.id} className="requirement-item">
          <input
            type="text"
            placeholder="Requirement description"
            value={req.description}
            onChange={(e) => updateRequirement(req.id, { description: e.target.value })}
          />
          
          <select
            value={req.category}
            onChange={(e) => updateRequirement(req.id, { category: e.target.value })}
          >
            <option value="safety">Safety</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
            <option value="inspection">Inspection</option>
            <option value="photo">Photo Documentation</option>
            <option value="other">Other</option>
          </select>
          
          <label>
            <input
              type="checkbox"
              checked={req.isRequired}
              onChange={(e) => updateRequirement(req.id, { isRequired: e.target.checked })}
            />
            Required
          </label>
          
          <input
            type="number"
            placeholder="Est. minutes"
            value={req.estimatedTime || ''}
            onChange={(e) => updateRequirement(req.id, { estimatedTime: parseInt(e.target.value) || 0 })}
          />
          
          <button onClick={() => deleteRequirement(req.id)}>Delete</button>
        </div>
      ))}
      
      <button onClick={addRequirement}>Add Requirement</button>
      <button onClick={saveRequirements}>Save Template</button>
    </div>
  );
};
```

### **2. Firestore Integration**

Update your property documents in Firestore:

```javascript
// In your webapp property service
const updatePropertyRequirements = async (propertyId, requirementsTemplate) => {
  await db.collection('properties').doc(propertyId).update({
    requirementsTemplate,
    updatedAt: serverTimestamp()
  });
};
```

---

## 📱 **Mobile App Integration**

### **1. Update Job Creation Service**

When creating jobs, copy requirements from property template:

```typescript
// In jobService.ts
const createJobWithPropertyRequirements = async (jobData, propertyId) => {
  // Get property requirements template
  const property = await propertyService.getProperty(propertyId);
  
  // Convert property template to job requirements
  const requirements = property.requirementsTemplate?.map(template => ({
    id: template.id,
    description: template.description,
    isCompleted: false,
    photos: [],
    notes: ''
  })) || [];
  
  // Create job with requirements
  const job = {
    ...jobData,
    requirements,
    propertyId
  };
  
  return await createJob(job);
};
```

### **2. Completion Wizard Enhancement**

The existing JobCompletionWizard will automatically work with these requirements since it reads from `job.requirements`.

---

## 🎨 **Example Property Requirements Templates**

### **Cleaning Jobs:**
```typescript
[
  {
    id: 'clean_01',
    description: 'Complete safety walkthrough of property',
    isRequired: true,
    category: 'safety',
    estimatedTime: 10
  },
  {
    id: 'clean_02', 
    description: 'Take before photos of all rooms',
    isRequired: true,
    category: 'photo',
    estimatedTime: 5
  },
  {
    id: 'clean_03',
    description: 'Clean all bathrooms thoroughly',
    isRequired: true,
    category: 'cleaning',
    estimatedTime: 30
  },
  {
    id: 'clean_04',
    description: 'Vacuum all carpeted areas',
    isRequired: true,
    category: 'cleaning',
    estimatedTime: 20
  },
  {
    id: 'clean_05',
    description: 'Take after photos of completed work',
    isRequired: true,
    category: 'photo',
    estimatedTime: 5
  }
]
```

### **Maintenance Jobs:**
```typescript
[
  {
    id: 'maint_01',
    description: 'Check all safety equipment (smoke detectors, fire extinguishers)',
    isRequired: true,
    category: 'safety',
    estimatedTime: 15
  },
  {
    id: 'maint_02',
    description: 'Document any damage or issues found',
    isRequired: true,
    category: 'inspection',
    estimatedTime: 10
  },
  {
    id: 'maint_03',
    description: 'Test all plumbing fixtures',
    isRequired: false,
    category: 'maintenance',
    estimatedTime: 20
  }
]
```

---

## 🔄 **Data Flow**

### **Creation Flow:**
1. **Property Manager** sets up requirements template in webapp
2. **Admin** creates job for that property
3. **System** automatically copies requirements from property template
4. **Staff** sees requirements in completion wizard

### **Completion Flow:**
1. **Staff** opens completion wizard
2. **Wizard** loads requirements from job
3. **Staff** validates each requirement
4. **System** stores completion data with requirement details

---

## ⚙️ **Advanced Features**

### **1. Requirement Categories**
Group requirements by type for better organization:
- 🛡️ **Safety** (fire safety, emergency exits, etc.)
- 🧹 **Cleaning** (specific cleaning tasks)
- 🔧 **Maintenance** (equipment checks, repairs)
- 🔍 **Inspection** (damage assessment, quality checks)
- 📸 **Photo** (documentation requirements)

### **2. Dynamic Requirements**
Requirements that change based on property features:
```typescript
// If property has pool, add pool-related requirements
if (property.hasPool) {
  requirements.push({
    id: 'pool_01',
    description: 'Check pool chemical levels',
    isRequired: true,
    category: 'maintenance'
  });
}
```

### **3. Requirement Dependencies**
Some requirements depend on others:
```typescript
{
  id: 'after_photos',
  description: 'Take after photos',
  isRequired: true,
  dependsOn: ['cleaning_complete'] // Only required after cleaning is done
}
```

---

## 🎯 **Quick Start Steps**

### **1. Update Property Interface** ✅
Already done - added `requirementsTemplate` to Property interface.

### **2. Create Webapp UI**
Add the requirements management section to your property edit page.

### **3. Update Job Creation**
Modify job creation to copy requirements from property template.

### **4. Test in Mobile App**
The completion wizard will automatically work with the new requirements.

---

## 💡 **Benefits Summary**

### **For Property Managers:**
- ✅ Standardized requirements across all jobs
- ✅ Easy to update requirements for all future jobs
- ✅ Consistent quality standards per property

### **For Staff:**
- ✅ Clear, specific requirements for each job
- ✅ Step-by-step guidance through completion wizard
- ✅ No guessing what needs to be done

### **For System:**
- ✅ Rich data collection for reporting and analysis
- ✅ Consistent requirement completion tracking
- ✅ Scalable across unlimited properties and job types

This system gives you **professional-grade job requirement management** that scales from a single property to thousands! 🚀
