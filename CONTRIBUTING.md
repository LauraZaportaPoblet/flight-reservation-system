# Contributing to Flight Reservation System

Thank you for your interest in contributing to the Flight Reservation System! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, MySQL version)

### Suggesting Features

Feature requests are welcome! Please include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any UI/UX mockups (if applicable)

### Pull Requests

1. **Fork the repository**
   ```bash
   gh repo fork NamitNamit/flight-reservation-system
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/flight-reservation-system.git
   cd flight-reservation-system
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

4. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

5. **Test your changes**
   - Test locally on both backend and frontend
   - Ensure no breaking changes
   - Verify database migrations work

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve bug description"
   ```

   **Commit Message Format:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting)
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide clear description of changes
   - Reference any related issues

## 📋 Development Guidelines

### Code Style

**JavaScript/React:**
- Use ES6+ syntax
- Functional components with hooks
- Meaningful variable names
- Keep functions small and focused
- Use async/await for promises

**Example:**
```javascript
// Good
const fetchFlightById = async (flightId) => {
    try {
        const response = await axios.get(`/api/flights/${flightId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching flight:', error);
        throw error;
    }
};

// Avoid
function getFlight(id) {
    return axios.get('/api/flights/' + id).then(res => res.data);
}
```

**SQL:**
- Use meaningful table/column names
- Add comments for complex queries
- Use transactions for multi-step operations
- Index foreign keys

### Project Structure

```
backend/
├── src/
│   ├── server.js           # Main server file
│   ├── middleware/         # Custom middleware
│   └── routes/             # API routes (if separated)

frontend/
├── src/
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   └── utils/              # Utility functions
```

### Testing Checklist

Before submitting a PR, ensure:

- [ ] Code runs without errors
- [ ] All existing features still work
- [ ] New features work as expected
- [ ] No console errors/warnings
- [ ] Database migrations are tested
- [ ] API endpoints are tested
- [ ] UI is responsive on mobile
- [ ] Documentation is updated
- [ ] No sensitive data (passwords, keys) in code

## 🎯 Areas for Contribution

### High Priority
- [ ] Add unit tests (Jest, React Testing Library)
- [ ] Add E2E tests (Cypress, Playwright)
- [ ] Implement email notifications
- [ ] Add flight status tracking
- [ ] Create admin dashboard
- [ ] Add analytics and reporting

### Medium Priority
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Implement caching (Redis)
- [ ] Add search filters
- [ ] Enhance mobile UI
- [ ] Add API documentation (Swagger)

### Low Priority
- [ ] Add internationalization (i18n)
- [ ] Add accessibility features
- [ ] Create Docker setup
- [ ] Add CI/CD pipeline
- [ ] Implement rate limiting
- [ ] Add logging system

## 🐛 Known Issues

Check the [Issues](https://github.com/NamitNamit/flight-reservation-system/issues) page for current bugs and feature requests.

## 📝 Documentation

When adding new features:
- Update README.md if necessary
- Add JSDoc comments for functions
- Update API endpoint documentation
- Add database schema changes to migration files

## 💬 Questions?

- Create a [Discussion](https://github.com/NamitNamit/flight-reservation-system/discussions)
- Open an [Issue](https://github.com/NamitNamit/flight-reservation-system/issues)

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## 🙏 Recognition

All contributors will be recognized in the project's README.md!

Thank you for contributing! 🎉
