//
//  AtlassianBaseRequestDelegate.m
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/25/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import "AtlassianRequestDelegates.h"

@implementation AtlassianBaseRequestDelegate

- (instancetype)init
{
    self = [super init];
    self.progress = [[NSProgress alloc] initWithParent:[NSProgress currentProgress] userInfo:nil];
    return self;
}

@end
