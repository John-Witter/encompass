import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

// for new assignments, workspace creation is done with parent component
// for updating assignments, workspace creation is done in this component
// this.args.isDisplayOnly only sent by new assignment parent, i.e. workspaces are not created in this component

export default class LinkedWorkspacesNew extends Component {
  @service('loading-display') loading;
  @tracked workspaceName = '';
  @tracked isCreating = true;
  @tracked groupWorkspacesToMake = [];
  @tracked studentWorkspacesToMake = [];
  @tracked allSelected = false;
  get showAllSelected() {
    return this.args.allSelected || this.allSelected;
  }
  constructor() {
    super(...arguments);
    this.workspaceName = this.defaultName;
  }

  get defaultName() {
    let assignmentName = this.args.assignmentName || this.args.assignment.name;
    let sectionName = this.args.sectionName || this.args.section.name;

    return `${assignmentName} (${sectionName})`;
  }

  get previewName() {
    return this.workspaceName || this.defaultName;
  }

  get allWsToMake() {
    if (this.args.isDisplayOnly) {
      return [
        ...this.args.groupWorkspacesToMake,
        ...this.args.studentWorkspacesToMake,
      ];
    }
    return [...this.groupWorkspacesToMake, ...this.studentWorkspacesToMake];
  }

  @action selectAll() {
    if (this.args.isDisplayOnly) {
      return this.args.selectAll();
    }
    if (this.allSelected) {
      this.studentWorkspacesToMake = [];
      this.groupWorkspacesToMake = [];
      this.allSelected = false;
      return;
    }
    this.studentWorkspacesToMake = this.args.students
      .filter((item) => item.constructor.modelName === 'user')
      .map((item) => item.id);
    this.groupWorkspacesToMake = this.args.students
      .filter((item) => item.constructor.modelName === 'group')
      .map((item) => item.id);
    this.allSelected = true;
  }

  @action update(student) {
    if (this.args.isDisplayOnly) {
      return this.args.updateLists(student);
    }
    if (student.constructor.modelName === 'user') {
      if (this.studentWorkspacesToMake.includes(student.id)) {
        this.studentWorkspacesToMake.splice(
          this.studentWorkspacesToMake.indexOf(student.id),
          1
        );
      } else {
        this.studentWorkspacesToMake = [
          ...this.studentWorkspacesToMake,
          student.id,
        ];
      }
    } else if (student.constructor.modelName === 'group') {
      if (this.groupWorkspacesToMake.includes(student.id)) {
        this.groupWorkspacesToMake.splice(
          this.groupWorkspacesToMake.indexOf(student.id),
          1
        );
      } else {
        this.groupWorkspacesToMake = [
          ...this.studentWorkspacesToMake,
          student.id,
        ];
      }
    } else {
      console.log('something went wrong');
    }
    this.allSelected = false;
  }

  @action cancel() {
    if (this.args.onCancel) {
      this.args.onCancel();
    } else {
      this.isCreating = false;
    }
  }
  @action create() {
    let assignment = this.args.assignment;

    if (!assignment) {
      return;
    }

    // this.loading.handleLoadingMessage(
    //   this,
    //   'start',
    //   'isRequestInProgress',
    //   'doShowLoadingMessage'
    // );

    assignment.linkedWorkspacesRequest = {
      ...assignment.linkedWorkspacesRequest,
      doAllowSubmissionUpdates: true,
      name: this.workspaceName || this.defaultName,
      doCreate: true,
      groupsToMake: this.groupWorkspacesToMake,
      studentsToMake: this.studentWorkspacesToMake,
    };

    assignment.parentWorkspaceRequest = { doCreate: false };
    return assignment
      .save()
      .then((assignment) => {
        // this.loading.handleLoadingMessage(
        //   this,
        //   'end',
        //   'isRequestInProgress',
        //   'doShowLoadingMessage'
        // );

        let createWorkspaceError = assignment.get(
          'linkedWorkspacesRequest.error'
        );

        if (createWorkspaceError) {
          return (this.createWorkspaceError = createWorkspaceError);
        }

        this.args.handleResults(assignment);
        this.cancel();
      })
      .catch((err) => {
        // this.loading.handleLoadingMessage(
        //   this,
        //   'start',
        //   'isRequestInProgress',
        //   'doShowLoadingMessage'
        // );

        this.createWorkspaceError = err;
      });
  }
}
