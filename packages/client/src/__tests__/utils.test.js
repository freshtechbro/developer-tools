import { formatDate, truncateText } from '../utils';
describe('Client Utils', () => {
    describe('formatDate', () => {
        it('should format a date correctly', () => {
            const date = new Date('2023-01-15T12:30:45Z');
            const formattedDate = formatDate(date);
            expect(formattedDate).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
        });
        it('should return empty string for invalid date', () => {
            const formattedDate = formatDate(null);
            expect(formattedDate).toBe('');
        });
    });
    describe('truncateText', () => {
        it('should truncate text longer than the specified length', () => {
            const longText = 'This is a very long text that needs to be truncated';
            const truncated = truncateText(longText, 20);
            expect(truncated).toBe('This is a very long ...');
            expect(truncated.length).toBeLessThanOrEqual(23); // 20 + 3 for ellipsis
        });
        it('should not truncate text shorter than the specified length', () => {
            const shortText = 'Short text';
            const truncated = truncateText(shortText, 20);
            expect(truncated).toBe(shortText);
        });
        it('should handle empty strings', () => {
            const emptyText = '';
            const truncated = truncateText(emptyText, 10);
            expect(truncated).toBe('');
        });
    });
});
