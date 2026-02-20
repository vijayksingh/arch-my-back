/**
 * Test suite for DSL Editor component
 * Tests visibility toggle and store integration
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

describe('DSL Editor Store', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useEditorStore.setState({
      dslEditorVisible: false,
    });
  });

  test('dslEditorVisible defaults to false', () => {
    const { dslEditorVisible } = useEditorStore.getState();
    expect(dslEditorVisible).toBe(false);
  });

  test('setDslEditorVisible updates visibility', () => {
    const store = useEditorStore.getState();

    store.setDslEditorVisible(true);
    expect(useEditorStore.getState().dslEditorVisible).toBe(true);

    store.setDslEditorVisible(false);
    expect(useEditorStore.getState().dslEditorVisible).toBe(false);
  });

  test('toggleDslEditor flips visibility', () => {
    const store = useEditorStore.getState();

    expect(useEditorStore.getState().dslEditorVisible).toBe(false);

    store.toggleDslEditor();
    expect(useEditorStore.getState().dslEditorVisible).toBe(true);

    store.toggleDslEditor();
    expect(useEditorStore.getState().dslEditorVisible).toBe(false);
  });

  test('toggleDslEditor called multiple times', () => {
    const store = useEditorStore.getState();

    store.toggleDslEditor();
    store.toggleDslEditor();
    store.toggleDslEditor();

    expect(useEditorStore.getState().dslEditorVisible).toBe(true);
  });
});
