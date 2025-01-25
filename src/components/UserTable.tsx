import { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { FaLock, FaUnlock, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/database';

export function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.id);
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('last_login', { ascending: false });

      if (error) {
        toast.error('Failed to fetch users');
        return;
      }

      setUsers(data || []);
    };

    fetchUsers();

    const channel = supabase
      .channel('user_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, fetchUsers)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map(user => user.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const handleBlock = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to block');
      return;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ status: 'blocked' })
      .in('id', selectedUsers);

    if (error) {
      toast.error('Failed to block users');
      return;
    }

    toast.success('Users blocked successfully');
    
    if (selectedUsers.includes(currentUser)) {
      await supabase.auth.signOut();
    }
  };

  const handleUnblock = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to unblock');
      return;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ status: 'active' })
      .in('id', selectedUsers);

    if (error) {
      toast.error('Failed to unblock users');
      return;
    }

    toast.success('Users unblocked successfully');
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to delete');
      return;
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .in('id', selectedUsers);

    if (error) {
      toast.error('Failed to delete users');
      return;
    }

    toast.success('Users deleted successfully');

    if (selectedUsers.includes(currentUser)) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="container mt-4">
      <div className="mb-3 d-flex gap-2">
        <Button 
          variant="danger" 
          onClick={handleBlock}
          title="Block selected users"
        >
          Block
        </Button>
        <Button 
          variant="success" 
          onClick={handleUnblock}
          title="Unblock selected users"
        >
          <FaUnlock />
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete}
          title="Delete selected users"
        >
          <FaTrash />
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>
              <Form.Check
                type="checkbox"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={selectedUsers.length === users.length}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Last Login</th>
            <th>Last Activity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <Form.Check
                  type="checkbox"
                  onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                  checked={selectedUsers.includes(user.id)}
                />
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{new Date(user.last_login).toLocaleString()}</td>
              <td>{new Date(user.last_activity).toLocaleString()}</td>
              <td>
                <span className={`badge bg-${user.status === 'active' ? 'success' : 'danger'}`}>
                  {user.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}