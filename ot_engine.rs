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
}

#[wasm_bindgen]
impl OtEngine {
    pub fn new() -> OtEngine {
        OtEngine {
            operations: VecDeque::new(),
        }
    }

    pub fn insert(&mut self, pos: usize, char: char) {
        self.operations.push_back(Operation::Insert { pos, char });
    }

    pub fn delete(&mut self, pos: usize) {
        self.operations.push_back(Operation::Delete { pos });
    }

    pub fn apply(&mut self, document: &mut String) {
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