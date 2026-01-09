# Test Reports Directory

This directory contains automated end-to-end test reports.

## Report Files

Each test run generates a JSON report with the format:
```
e2e-test-[timestamp].json
```

## Report Structure

```json
{
  "totalTests": 7,
  "passedTests": 7,
  "failedTests": 0,
  "successRate": "100.0",
  "results": [
    {
      "step": "Test Step Name",
      "success": true,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "data": { ... },
      "error": null
    }
  ],
  "testArtifacts": {
    "propertyId": "prop_xyz",
    "bookingId": "booking_abc",
    "jobId": "job_def"
  }
}
```

## Viewing Reports

Reports are JSON files that can be:
- Opened in any text editor
- Parsed programmatically
- Shared with stakeholders
- Archived for compliance

## Test Artifacts

Each report includes IDs for:
- **Property ID:** The test property used
- **Booking ID:** The test booking created
- **Job ID:** The cleaning job created

Use these IDs to:
- Verify results in Firebase Console
- Clean up test data
- Debug issues

## Retention

Keep reports for:
- Historical reference
- Compliance documentation
- Performance tracking
- Issue debugging

Recommended retention: 90 days minimum

---

**Note:** This directory is auto-created by the test script. Reports are automatically saved here after each test run.
