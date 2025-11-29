/**
 * Переиспользуемые стили компонентов
 * Централизованное хранение стилей для избежания дублирования
 */

import { COLORS, SIZES, FONTS, FONT_SIZES } from './constants.js';

/**
 * Стили для кнопок
 */
export const buttonStyles = {
  primary: {
    backgroundColor: COLORS.PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: `${SIZES.BORDER_RADIUS}px`,
    padding: '10px 20px',
    fontSize: `${FONT_SIZES.BUTTON_SMALL}px`,
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: FONTS.PRIMARY,
  },
  secondary: {
    backgroundColor: '#fff',
    color: COLORS.TEXT,
    border: `1px solid #ddd`,
    borderRadius: `${SIZES.BORDER_RADIUS}px`,
    padding: '10px 20px',
    fontSize: `${FONT_SIZES.BUTTON_SMALL}px`,
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: FONTS.PRIMARY,
  },
  header: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    fontSize: `${FONT_SIZES.HEADER_BUTTON}px`,
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: FONTS.PRIMARY,
  },
  icon: {
    backgroundColor: COLORS.PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: `${FONT_SIZES.BUTTON_MEDIUM}px`,
    fontFamily: FONTS.PRIMARY,
  },
  save: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: `${SIZES.BORDER_RADIUS}px`,
    padding: '12px',
    cursor: 'pointer',
    fontSize: `${FONT_SIZES.BUTTON_SMALL}px`,
    fontWeight: 'bold',
    fontFamily: FONTS.PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  cancel: {
    flex: 1,
    backgroundColor: '#fff',
    color: COLORS.TEXT,
    border: '1px solid #ddd',
    borderRadius: `${SIZES.BORDER_RADIUS}px`,
    padding: '12px',
    cursor: 'pointer',
    fontSize: `${FONT_SIZES.BUTTON_SMALL}px`,
    fontWeight: 'bold',
    fontFamily: FONTS.PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

/**
 * Стили для контейнеров
 */
export const containerStyles = {
  sidebar: {
    backgroundColor: 'transparent',
    padding: '0',
    flexShrink: 0,
  },
  sidebarWrapper: {
    backgroundColor: COLORS.SIDEBAR_BG,
    borderRadius: `${SIZES.BORDER_RADIUS_LARGE}px`,
    padding: '20px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  stageContainer: {
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: `${SIZES.BORDER_RADIUS_LARGE}px`,
    padding: '0',
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUND,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '100%',
  },
  patternCard: {
    marginBottom: '12px',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: `${SIZES.BORDER_RADIUS}px`,
    padding: '15px',
  },
};

/**
 * Стили для полей ввода
 */
export const inputStyles = {
  textarea: {
    width: '100%',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: `${FONT_SIZES.PROPERTY_LABEL}px`,
    minHeight: '40px',
    resize: 'vertical',
    fontFamily: FONTS.DEFAULT,
  },
  text: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: `1px solid ${COLORS.BORDER}`,
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: FONTS.DEFAULT,
  },
};

/**
 * Стили для текста
 */
export const textStyles = {
  patternName: {
    fontWeight: 'bold',
    marginBottom: '12px',
    fontSize: `${FONT_SIZES.PATTERN_NAME}px`,
    color: COLORS.TEXT,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
  },
  propertyLabel: {
    fontWeight: 'bold',
    marginBottom: '2px',
    color: COLORS.TEXT,
    fontSize: `${FONT_SIZES.PROPERTY_LABEL}px`,
  },
  propertyValue: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: `${FONT_SIZES.PROPERTY_VALUE}px`,
  },
};

