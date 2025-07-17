import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';

export default function ProfileScreen() {
  const { staffProfile, signOut } = useAuth();
  const { jobs, completedJobs } = useJobs();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!staffProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Avatar.Text
              size={80}
              label={getInitials(staffProfile.firstName, staffProfile.lastName)}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.profileInfo}>
              <Title style={styles.name}>
                {staffProfile.firstName} {staffProfile.lastName}
              </Title>
              <Text style={styles.role}>{staffProfile.role}</Text>
              <Text style={styles.email}>{staffProfile.email}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Job Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Job Statistics</Title>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{jobs.length}</Text>
                <Text style={styles.statLabel}>Total Jobs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedJobs.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account Information</Title>
            
            <List.Item
              title="Employee ID"
              description={staffProfile.id}
              left={(props: any) => <List.Icon {...props} icon="badge-account" color="#3B82F6" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            
            <List.Item
              title="Role"
              description={staffProfile.role}
              left={(props: any) => <List.Icon {...props} icon="account-tie" color="#3B82F6" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            
            <List.Item
              title="Status"
              description={staffProfile.isActive ? 'Active' : 'Inactive'}
              left={(props: any) => <List.Icon {...props} icon="account-check" color={staffProfile.isActive ? '#10B981' : '#EF4444'} />}
              titleStyle={styles.listTitle}
              descriptionStyle={[
                styles.listDescription,
                { color: staffProfile.isActive ? '#10B981' : '#EF4444' }
              ]}
            />
            
            <List.Item
              title="Member Since"
              description={formatDate(staffProfile.createdAt)}
              left={(props: any) => <List.Icon {...props} icon="calendar" color="#3B82F6" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            
            {staffProfile.lastLoginAt && (
              <List.Item
                title="Last Login"
                description={formatDate(staffProfile.lastLoginAt)}
                left={(props: any) => <List.Icon {...props} icon="login" color="#3B82F6" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            )}
            
            <List.Item
              title="Login Count"
              description={`${staffProfile.loginCount} times`}
              left={(props: any) => <List.Icon {...props} icon="counter" color="#3B82F6" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Information</Title>
            
            <List.Item
              title="App Version"
              description="1.0.0"
              left={(props: any) => <List.Icon {...props} icon="cellphone" color="#3B82F6" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            
            <List.Item
              title="Company"
              description="Sia Moon Property Management"
              left={(props: any) => <List.Icon {...props} icon="domain" color="#3B82F6" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Actions</Title>
            
            <Button
              mode="outlined"
              onPress={handleSignOut}
              style={styles.signOutButton}
              icon="logout"
              labelStyle={styles.signOutButtonText}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Paragraph style={styles.footerText}>
            Sia Moon Property Management
          </Paragraph>
          <Paragraph style={styles.footerSubtext}>
            Staff Mobile Application
          </Paragraph>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1F2937',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    backgroundColor: '#3B82F6',
  },
  avatarLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  card: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#1F2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listTitle: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  listDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  signOutButton: {
    borderColor: '#EF4444',
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#4B5563',
    fontSize: 12,
  },
});
