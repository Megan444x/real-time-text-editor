extern crate wasm_bindgen;

use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone)]
enum Operation {
    Insert { pos: usize, char: char },
    Delete { pos: usize },
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

    pub fn insert(&mut self, pos: usize, char: char) {
        self.operations.push_back(Operation::Insert { pos, char });
    }

    pub fn delete(&mut self, pos: usize) {
        self.operations.push_back(Operation::Delete { pos });
    }

    pub fn apply(&mut self, document: &mut String) {
        if !self.operations.is_empty() {
            self.history.push(self.operations.clone());
        }
        
        while let Some(op) = self.operations.pop_front() {
            match op {
                Operation::Insert { pos, char } => {
                    if pos <= document.len() {
                        document.insert(pos, char);
                    }
                },
                Operation::Delete { pos } => {
                    if pos < document.len() {
                        document.remove(pos);
                    }
                },
            }
        }
    }
    
    pub fn undo(&mut self, document: &mut String) {
        if let Some(ops) = self.history.pop() {
            for op in ops.iter().rev() {
                match op {
                    Operation::Insert { pos, .. } => {
                        if *pos < document.len() {
                            document.remove(*pos);
                        }
                    },
                    Operation::Delete { pos, char } => {
                        if *pos <= document.len() {
                            document.insert(*pos, *char);
                        }
                    },
                }
            }
        }
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