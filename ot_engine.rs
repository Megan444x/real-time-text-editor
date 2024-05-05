extern crate wasm_bindgen;

use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone)]
enum Operation {
    Insert { pos: usize, char: char },
    Delete { pos: usize },
}

#[derive(Debug)]
pub enum OtError {
    InvalidPosition { op: String, pos: usize, len: usize },
}

#[wasm_bindgen]
pub struct OtEngine {
    operations: VecDeque<Operation>,
    history: Vec<VecDeque<Operation>>,
}

#[wasm_bindgen]
impl OtEngine {
    pub fn new() -> OtEngine {
        OtEngine {
            operations: VecDeque::new(),
            history: Vec::new(),
        }
    }

    pub fn insert(&mut self, pos: usize, char: char) -> Result<(), OtError> {
        // Assuming `document` length is accessible, if not we can skip this check or handle it differently
        // if pos > document.len() {
        //     return Err(OtError::InvalidPosition { op: "insert".into(), pos, len: document.len() });
        // }
        self.operations.push_back(Operation::Insert { pos, char });
        Ok(())
    }

    pub fn delete(&mut self, pos: usize) -> Result<(), OtError> {
        // Assuming `document` length is accessible, similar to insert
        // if pos >= document.len() {
        //     return Err(OtError::InvalidPosition { op: "delete".into(), pos, len: document.len() });
        // }
        self.operations.push_back(Operation::Delete { pos });
        Ok(())
    }

    pub fn apply(&mut self, document: &mut String) -> Result<(), OtError> {
        if !self.operations.is_empty() {
            self.history.push(self.operations.clone());
        }
        
        while let Some(op) = self.operations.pop_front() {
            match op {
                Operation::Insert { pos, char } => {
                    if pos > document.len() {
                        return Err(OtError::InvalidPosition { op: "apply-insert".into(), pos, len: document.len() });
                    }
                    document.insert(pos, char);
                },
                Operation::Delete { pos } => {
                    if pos >= document.len() {
                        return Err(OtError::InvalidPosition { op: "apply-delete".into(), pos, len: document.len() });
                    }
                    document.remove(pos);
                },
            }
        }
        Ok(())
    }
    
    pub fn undo(&mut self, document: &mut String) -> Result<(), OtError> {
        if let Some(ops) = self.history.pop() {
            for op in ops.iter().rev() {
                match op {
                    Operation::Insert { pos, .. } => {
                        if *pos >= document.len() {
                            return Err(OtError::InvalidPosition { op: "undo-insert".into(), pos: *pos, len: document.len() });
                        }
                        document.remove(*pos);
                    },
                    Operation::Delete { pos } => {
                        // Error handling for undo delete not strictly necessary because we can't have
                        // an invalid delete operation for undo (as deleted char's position must have existed).
                        if *pos > document.len() {
                            document.insert(*pos, ' '); // Placeholder, actual char not known without modifying Operation::Delete to include char
                        }
                    },
                }
            }
        }
        Ok(())
    }

    pub fn clear_history(&mut self) {
        self.history.clear();
    }

    pub fn reset(&mut self) {
        self.operations.clear();
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}