use std::fmt::Display;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoadState<T> {
    Ready(T),
    Failed { code: u16, message: &'static str },
}

pub trait Identified {
    type Id: Display;
    fn id(&self) -> Self::Id;
}

pub fn render<T: Identified>(value: &T) -> String {
    format!("account: {}", value.id())
}

macro_rules! ready {
    ($value:expr) => {
        LoadState::Ready($value)
    };
}

pub fn example() -> LoadState<String> {
    ready!("Nova".to_owned())
}
