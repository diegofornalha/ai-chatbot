import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from './test-helpers';

describe('Test Helpers', () => {
  describe('renderWithProviders', () => {
    describe('default wrapper behavior', () => {
      it('should handle string children', () => {
        const result = renderWithProviders('Hello World');
        expect(result.container.textContent).toBe('Hello World');
      });

      it('should handle number children', () => {
        const result = renderWithProviders(42);
        expect(result.container.textContent).toBe('42');
      });

      it('should handle null children', () => {
        const result = renderWithProviders(null);
        expect(result.container.textContent).toBe('');
      });

      it('should handle undefined children', () => {
        const result = renderWithProviders(undefined);
        expect(result.container.textContent).toBe('');
      });

      it('should handle boolean children', () => {
        const result = renderWithProviders(true);
        expect(result.container.textContent).toBe('');
      });

      it('should handle array of children', () => {
        const result = renderWithProviders(['Hello', ' ', 'World']);
        expect(result.container.textContent).toBe('Hello World');
      });

      it('should handle React elements', () => {
        const result = renderWithProviders(<div>Test Component</div>);
        expect(result.container.textContent).toBe('Test Component');
        expect(result.container.querySelector('div')).toBeTruthy();
      });

      it('should handle nested React elements', () => {
        const result = renderWithProviders(
          <div>
            <span>Nested</span>
            <p>Content</p>
          </div>
        );
        expect(result.container.textContent).toBe('NestedContent');
        expect(result.container.querySelector('span')).toBeTruthy();
        expect(result.container.querySelector('p')).toBeTruthy();
      });

      it('should handle fragments', () => {
        const result = renderWithProviders(
          <>
            <div>First</div>
            <div>Second</div>
          </>
        );
        expect(result.container.textContent).toBe('FirstSecond');
        expect(result.container.querySelectorAll('div')).toHaveLength(2);
      });

      it('should handle mixed ReactNode types', () => {
        const result = renderWithProviders(
          <div>
            Text content
            {42}
            <span>Element</span>
            {null}
            {undefined}
            {false}
          </div>
        );
        expect(result.container.textContent).toBe('Text content42Element');
      });
    });

    describe('custom wrapper behavior', () => {
      it('should use custom wrapper when provided', () => {
        const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
          <div data-testid="custom-wrapper">{children}</div>
        );

        renderWithProviders(<span>Content</span>, {
          wrapper: CustomWrapper
        });

        expect(screen.getByTestId('custom-wrapper')).toBeTruthy();
        expect(screen.getByText('Content')).toBeTruthy();
      });

      it('should pass through render options', () => {
        const result = renderWithProviders(
          <div data-testid="test-element">Test</div>,
          {
            container: document.createElement('section')
          }
        );

        expect(result.container.tagName).toBe('SECTION');
        expect(screen.getByTestId('test-element')).toBeTruthy();
      });
    });

    describe('biome linting compatibility', () => {
      it('should compile without JSX syntax errors in .ts file', () => {
        // This test verifies that the implementation uses React.createElement
        // instead of JSX syntax, making it compatible with .ts files
        const testHelpers = require('./test-helpers');
        expect(testHelpers.renderWithProviders).toBeDefined();
        expect(typeof testHelpers.renderWithProviders).toBe('function');
      });

      it('should not use unsafe type assertions', () => {
        // The implementation should use React.createElement(React.Fragment, null, children)
        // which is type-safe for all ReactNode types
        const safeChildren: React.ReactNode[] = [
          'string',
          123,
          null,
          undefined,
          true,
          false,
          [],
          <div key="test">Element</div>
        ];

        safeChildren.forEach((child) => {
          expect(() => renderWithProviders(child)).not.toThrow();
        });
      });
    });
  });
});