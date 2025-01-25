import { useState } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      if (signUpError.message.includes('unique')) {
        toast.error('Email already exists');
      } else {
        toast.error(signUpError.message);
      }
      return;
    }

    if (user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: user.id,
            email,
            name,
          }
        ]);

      if (profileError) {
        if (profileError.message.includes('unique')) {
          toast.error('Email already exists');
        } else {
          toast.error('Failed to create profile');
        }
        return;
      }

      toast.success('Registered successfully');
      navigate('/');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Register</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Register
            </Button>
          </Form>

          <div className="text-center mt-3">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}