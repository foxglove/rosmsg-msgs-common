# rosmsg-msgs-common

This library exports a map of ROS1 datatype string keys to [@foxglove/rosmsg](https://github.com/foxglove/rosmsg) `RosMsgDefinition` values for most common ROS1 message definitions. The message definitions were extracted from the `ros:noetic-robot-focal` Docker container using the `gendeps --cat` command.

## License

@foxglove/rosmsg-msgs-common is licensed under [MIT License](https://opensource.org/licenses/MIT).

## Releasing

1. Run `yarn version --[major|minor|patch]` to bump version
2. Run `git push && git push --tags` to push new tag
3. GitHub Actions will take care of the rest

## Stay in touch

Join our [Slack channel](https://foxglove.dev/join-slack) to ask questions, share feedback, and stay up to date on what our team is working on.
