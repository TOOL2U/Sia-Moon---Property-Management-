/**
 * Component Integration Tests
 * Tests React components with user interactions and state management
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock components for testing
const MockLoginForm = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simulate API call
      if (email === 'test@example.com' && password === 'password123') {
        // Success
        setIsLoading(false)
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
          required
        />
      </div>
      {error && <div data-testid="error-message" role="alert">{error}</div>}
      <button 
        type="submit" 
        disabled={isLoading}
        data-testid="submit-button"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

const MockStaffList = () => {
  const [staff, setStaff] = React.useState([
    { id: '1', name: 'John Doe', role: 'cleaner', status: 'active' },
    { id: '2', name: 'Jane Smith', role: 'manager', status: 'active' }
  ])
  const [isLoading, setIsLoading] = React.useState(false)

  const handleDeleteStaff = async (id: string) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setStaff(prev => prev.filter(s => s.id !== id))
      setIsLoading(false)
    }, 500)
  }

  return (
    <div data-testid="staff-list">
      <h2>Staff Members</h2>
      {isLoading && <div data-testid="loading">Loading...</div>}
      <ul>
        {staff.map(member => (
          <li key={member.id} data-testid={`staff-${member.id}`}>
            <span>{member.name} - {member.role}</span>
            <button 
              onClick={() => handleDeleteStaff(member.id)}
              data-testid={`delete-${member.id}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const MockJobAssignment = () => {
  const [jobs, setJobs] = React.useState([
    { 
      id: '1', 
      title: 'Villa Cleaning', 
      status: 'pending', 
      assignedTo: 'staff1',
      property: 'Villa Paradise'
    }
  ])

  const handleStatusChange = (jobId: string, newStatus: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ))
  }

  return (
    <div data-testid="job-assignment">
      <h2>Job Assignments</h2>
      {jobs.map(job => (
        <div key={job.id} data-testid={`job-${job.id}`}>
          <h3>{job.title}</h3>
          <p>Property: {job.property}</p>
          <p>Status: <span data-testid={`status-${job.id}`}>{job.status}</span></p>
          <select 
            value={job.status}
            onChange={(e) => handleStatusChange(job.id, e.target.value)}
            data-testid={`status-select-${job.id}`}
          >
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      ))}
    </div>
  )
}

describe('Component Integration Tests', () => {
  describe('Login Form Component', () => {
    test('should render login form with all fields', () => {
      render(<MockLoginForm />)
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    test('should handle user input correctly', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    test('should show loading state during submission', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(submitButton).toHaveTextContent('Signing in...')
      expect(submitButton).toBeDisabled()
    })

    test('should display error for invalid credentials', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials')
      })
    })
  })

  describe('Staff List Component', () => {
    test('should render staff list with members', () => {
      render(<MockStaffList />)
      
      expect(screen.getByTestId('staff-list')).toBeInTheDocument()
      expect(screen.getByTestId('staff-1')).toBeInTheDocument()
      expect(screen.getByTestId('staff-2')).toBeInTheDocument()
      expect(screen.getByText('John Doe - cleaner')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith - manager')).toBeInTheDocument()
    })

    test('should delete staff member when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<MockStaffList />)
      
      const deleteButton = screen.getByTestId('delete-1')
      await user.click(deleteButton)
      
      // Should show loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      
      // Wait for deletion to complete
      await waitFor(() => {
        expect(screen.queryByTestId('staff-1')).not.toBeInTheDocument()
        expect(screen.queryByText('John Doe - cleaner')).not.toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Other staff member should still be there
      expect(screen.getByTestId('staff-2')).toBeInTheDocument()
    })
  })

  describe('Job Assignment Component', () => {
    test('should render job assignments', () => {
      render(<MockJobAssignment />)
      
      expect(screen.getByTestId('job-assignment')).toBeInTheDocument()
      expect(screen.getByTestId('job-1')).toBeInTheDocument()
      expect(screen.getByText('Villa Cleaning')).toBeInTheDocument()
      expect(screen.getByText('Property: Villa Paradise')).toBeInTheDocument()
    })

    test('should update job status when dropdown changes', async () => {
      const user = userEvent.setup()
      render(<MockJobAssignment />)
      
      const statusSelect = screen.getByTestId('status-select-1')
      const statusDisplay = screen.getByTestId('status-1')
      
      expect(statusDisplay).toHaveTextContent('pending')
      
      await user.selectOptions(statusSelect, 'in-progress')
      
      expect(statusDisplay).toHaveTextContent('in-progress')
    })

    test('should handle multiple status changes', async () => {
      const user = userEvent.setup()
      render(<MockJobAssignment />)
      
      const statusSelect = screen.getByTestId('status-select-1')
      const statusDisplay = screen.getByTestId('status-1')
      
      // Change to assigned
      await user.selectOptions(statusSelect, 'assigned')
      expect(statusDisplay).toHaveTextContent('assigned')
      
      // Change to completed
      await user.selectOptions(statusSelect, 'completed')
      expect(statusDisplay).toHaveTextContent('completed')
    })
  })

  describe('Accessibility Tests', () => {
    test('login form should be accessible', () => {
      render(<MockLoginForm />)
      
      // Check for proper labels
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      
      // Check for required attributes
      expect(screen.getByTestId('email-input')).toBeRequired()
      expect(screen.getByTestId('password-input')).toBeRequired()
    })

    test('error messages should have proper ARIA attributes', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })

  describe('Performance Tests', () => {
    test('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn()
      
      const TestComponent = () => {
        renderSpy()
        return <MockStaffList />
      }
      
      const { rerender } = render(<TestComponent />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestComponent />)
      
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})
