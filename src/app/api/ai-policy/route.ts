import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from "next/server"
import path from 'path'

// Path to the company rules configuration file
const RULES_FILE_PATH = path.join(process.cwd(), 'config', 'companyRules.json')

// Default company rules if file doesn't exist
const DEFAULT_RULES = [
  "All jobs over ฿5,000 must be escalated for human review",
  "Do not assign staff more than 5km away unless marked as remote-capable",
  "Reject incomplete booking data (missing address or job type)",
  "Prioritize staff with highest ratings for VIP customers",
  "Ensure minimum 2-hour gap between staff assignments",
  "Flag recurring expenses that exceed 10% variance from budget",
  "Auto-approve expenses under ฿1,000 with 90%+ confidence",
  "Require human approval for expenses over ฿10,000",
  "Monitor cash flow to maintain minimum 30-day operating reserve",
  "Reject expenses without proper documentation or receipts"
]

// Interface for company rules data
interface CompanyRulesData {
  rules: string[]
  lastUpdated: string
  version: number
}

/**
 * Ensure the config directory and rules file exist
 */
async function ensureRulesFile(): Promise<void> {
  try {
    const configDir = path.dirname(RULES_FILE_PATH)

    // Create config directory if it doesn't exist
    try {
      await fs.access(configDir)
    } catch {
      await fs.mkdir(configDir, { recursive: true })
      console.log('📁 Created config directory:', configDir)
    }

    // Create rules file if it doesn't exist
    try {
      await fs.access(RULES_FILE_PATH)
    } catch {
      const initialData: CompanyRulesData = {
        rules: DEFAULT_RULES,
        lastUpdated: new Date().toISOString(),
        version: 1
      }
      await fs.writeFile(RULES_FILE_PATH, JSON.stringify(initialData, null, 2))
      console.log('📋 Created initial company rules file')
    }
  } catch (error) {
    console.error('❌ Error ensuring rules file:', error)
    throw error
  }
}

/**
 * Read company rules from file
 */
async function readRules(): Promise<CompanyRulesData> {
  try {
    await ensureRulesFile()
    const fileContent = await fs.readFile(RULES_FILE_PATH, 'utf-8')
    const data = JSON.parse(fileContent) as CompanyRulesData

    // Ensure data has required fields
    if (!data.rules || !Array.isArray(data.rules)) {
      throw new Error('Invalid rules data structure')
    }

    return {
      rules: data.rules,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      version: data.version || 1
    }
  } catch (error) {
    console.error('❌ Error reading rules:', error)

    // Return default rules if file is corrupted
    return {
      rules: DEFAULT_RULES,
      lastUpdated: new Date().toISOString(),
      version: 1
    }
  }
}

/**
 * Write company rules to file
 */
async function writeRules(rules: string[]): Promise<CompanyRulesData> {
  try {
    await ensureRulesFile()

    // Read current data to preserve version
    const currentData = await readRules()

    const newData: CompanyRulesData = {
      rules: rules.filter(rule => rule.trim().length > 0), // Remove empty rules
      lastUpdated: new Date().toISOString(),
      version: currentData.version + 1
    }

    await fs.writeFile(RULES_FILE_PATH, JSON.stringify(newData, null, 2))
    console.log('💾 Updated company rules, version:', newData.version)

    return newData
  } catch (error) {
    console.error('❌ Error writing rules:', error)
    throw error
  }
}

/**
 * GET /api/ai-policy
 * Return current company rules
 */
export async function GET(req: NextRequest) {
  try {
    console.log('📋 AI Policy: Getting company rules...')

    const rulesData = await readRules()

    console.log(`✅ AI Policy: Retrieved ${rulesData.rules.length} rules (v${rulesData.version})`)

    return NextResponse.json({
      success: true,
      rules: rulesData.rules,
      metadata: {
        lastUpdated: rulesData.lastUpdated,
        version: rulesData.version,
        totalRules: rulesData.rules.length
      }
    })

  } catch (error) {
    console.error('❌ AI Policy: Error getting rules:', error)

    return NextResponse.json({
      success: false,
      error: "Failed to retrieve company rules",
      rules: DEFAULT_RULES, // Fallback to default rules
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: 0,
        totalRules: DEFAULT_RULES.length
      }
    }, { status: 500 })
  }
}

/**
 * POST /api/ai-policy
 * Add new rule or update all rules
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📋 AI Policy: Adding/updating rules...')

    const body = await req.json()

    if (body.rule && typeof body.rule === 'string') {
      // Add single rule
      const currentData = await readRules()
      const newRule = body.rule.trim()

      if (newRule.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Rule cannot be empty"
        }, { status: 400 })
      }

      if (currentData.rules.includes(newRule)) {
        return NextResponse.json({
          success: false,
          error: "Rule already exists"
        }, { status: 400 })
      }

      const updatedRules = [...currentData.rules, newRule]
      const newData = await writeRules(updatedRules)

      console.log(`✅ AI Policy: Added new rule (total: ${newData.rules.length})`)

      return NextResponse.json({
        success: true,
        message: "Rule added successfully",
        rules: newData.rules,
        metadata: {
          lastUpdated: newData.lastUpdated,
          version: newData.version,
          totalRules: newData.rules.length
        }
      })

    } else if (body.rules && Array.isArray(body.rules)) {
      // Update all rules
      const rules = body.rules.filter((rule: any) =>
        typeof rule === 'string' && rule.trim().length > 0
      )

      if (rules.length === 0) {
        return NextResponse.json({
          success: false,
          error: "At least one valid rule is required"
        }, { status: 400 })
      }

      const newData = await writeRules(rules)

      console.log(`✅ AI Policy: Updated all rules (total: ${newData.rules.length})`)

      return NextResponse.json({
        success: true,
        message: "Rules updated successfully",
        rules: newData.rules,
        metadata: {
          lastUpdated: newData.lastUpdated,
          version: newData.version,
          totalRules: newData.rules.length
        }
      })

    } else {
      return NextResponse.json({
        success: false,
        error: "Invalid request body. Expected 'rule' (string) or 'rules' (array)"
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ AI Policy: Error adding/updating rules:', error)

    return NextResponse.json({
      success: false,
      error: "Failed to add/update rules",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ai-policy
 * Update rule by index
 */
export async function PUT(req: NextRequest) {
  try {
    console.log('📋 AI Policy: Updating rule by index...')

    const body = await req.json()
    const { index, rule } = body

    if (typeof index !== 'number' || typeof rule !== 'string') {
      return NextResponse.json({
        success: false,
        error: "Invalid request body. Expected 'index' (number) and 'rule' (string)"
      }, { status: 400 })
    }

    const trimmedRule = rule.trim()
    if (trimmedRule.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Rule cannot be empty"
      }, { status: 400 })
    }

    const currentData = await readRules()

    if (index < 0 || index >= currentData.rules.length) {
      return NextResponse.json({
        success: false,
        error: `Invalid index. Must be between 0 and ${currentData.rules.length - 1}`
      }, { status: 400 })
    }

    // Check if rule already exists at different index
    const existingIndex = currentData.rules.indexOf(trimmedRule)
    if (existingIndex !== -1 && existingIndex !== index) {
      return NextResponse.json({
        success: false,
        error: "Rule already exists at different position"
      }, { status: 400 })
    }

    const updatedRules = [...currentData.rules]
    updatedRules[index] = trimmedRule

    const newData = await writeRules(updatedRules)

    console.log(`✅ AI Policy: Updated rule at index ${index}`)

    return NextResponse.json({
      success: true,
      message: "Rule updated successfully",
      rules: newData.rules,
      metadata: {
        lastUpdated: newData.lastUpdated,
        version: newData.version,
        totalRules: newData.rules.length
      }
    })

  } catch (error) {
    console.error('❌ AI Policy: Error updating rule:', error)

    return NextResponse.json({
      success: false,
      error: "Failed to update rule",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/ai-policy
 * Delete rule by index
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('📋 AI Policy: Deleting rule by index...')

    const url = new URL(req.url)
    const indexParam = url.searchParams.get('index')

    if (!indexParam) {
      return NextResponse.json({
        success: false,
        error: "Missing 'index' query parameter"
      }, { status: 400 })
    }

    const index = parseInt(indexParam, 10)
    if (isNaN(index)) {
      return NextResponse.json({
        success: false,
        error: "Invalid index. Must be a number"
      }, { status: 400 })
    }

    const currentData = await readRules()

    if (index < 0 || index >= currentData.rules.length) {
      return NextResponse.json({
        success: false,
        error: `Invalid index. Must be between 0 and ${currentData.rules.length - 1}`
      }, { status: 400 })
    }

    if (currentData.rules.length <= 1) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete the last remaining rule"
      }, { status: 400 })
    }

    const updatedRules = currentData.rules.filter((_, i) => i !== index)
    const newData = await writeRules(updatedRules)

    console.log(`✅ AI Policy: Deleted rule at index ${index} (remaining: ${newData.rules.length})`)

    return NextResponse.json({
      success: true,
      message: "Rule deleted successfully",
      rules: newData.rules,
      metadata: {
        lastUpdated: newData.lastUpdated,
        version: newData.version,
        totalRules: newData.rules.length
      }
    })

  } catch (error) {
    console.error('❌ AI Policy: Error deleting rule:', error)

    return NextResponse.json({
      success: false,
      error: "Failed to delete rule",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
